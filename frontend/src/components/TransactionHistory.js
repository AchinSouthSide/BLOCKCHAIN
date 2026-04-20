import React, { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import NetworkConfig from '../services/NetworkConfig';
import '../styles/TransactionHistory.css';

function shortHash(hash) {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function toEth(value) {
  if (value == null) return '0';
  try {
    // ethers v6 accepts bigint | string | number-like BigNumberish
    return ethers.formatEther(value);
  } catch {
    try {
      return ethers.formatEther(value.toString());
    } catch {
      return '0';
    }
  }
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * TransactionHistory
 * Minimal on-chain event viewer to support financial auditing (thu vào/chi ra) + field changes.
 *
 * Props:
 * - contract: ethers Contract instance (connected)
 * - address: current wallet address (optional)
 * - mode: 'global' | 'wallet' (default 'wallet')
 * - limit: max rows (default 30)
 * - lookbackBlocks: blocks to scan backwards (default 20000)
 */
function TransactionHistory({ contract, address, mode = 'wallet', limit = 30, lookbackBlocks = 20000 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ inEth: '0', outEth: '0', creditedEth: '0', feeEth: '0' });

  const lowerAddress = useMemo(() => (address ? String(address).toLowerCase() : ''), [address]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError('');
        setRows([]);

        if (!contract) {
          setLoading(false);
          return;
        }

        const provider = contract?.runner?.provider || contract?.provider;
        if (!provider || typeof provider.getBlockNumber !== 'function') {
          throw new Error('Không tìm thấy provider để đọc lịch sử giao dịch');
        }

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, safeNum(currentBlock) - safeNum(lookbackBlocks));

        const filters = {
          BookingCreated: contract.filters.BookingCreated?.(),
          BookingConfirmed: contract.filters.BookingConfirmed?.(),
          BookingCancelled: contract.filters.BookingCancelled?.(),
          BalanceWithdrawn: contract.filters.BalanceWithdrawn?.(),
          FieldCreated: contract.filters.FieldCreated?.(),
          FieldCreatedV2: contract.filters.FieldCreatedV2?.(),
          FieldUpdated: contract.filters.FieldUpdated?.(),
          FieldUpdatedV2: contract.filters.FieldUpdatedV2?.(),
          FieldStatusChanged: contract.filters.FieldStatusChanged?.(),
          FieldDeleted: contract.filters.FieldDeleted?.(),
        };

        const enabledEntries = Object.entries(filters).filter(([, f]) => !!f);
        const logsByName = await Promise.all(
          enabledEntries.map(async ([name, filter]) => {
            try {
              const logs = await contract.queryFilter(filter, fromBlock, currentBlock);
              return [name, logs];
            } catch (e) {
              return [name, []];
            }
          })
        );

        const allLogs = logsByName.flatMap(([name, logs]) => logs.map(l => ({ name, log: l })));
        allLogs.sort((a, b) => {
          if (a.log.blockNumber !== b.log.blockNumber) return b.log.blockNumber - a.log.blockNumber;
          return (b.log.index ?? 0) - (a.log.index ?? 0);
        });

        // Enrich logs into rows
        const sliced = allLogs.slice(0, Math.max(limit * 3, limit));

        // Cache block timestamps
        const blockTs = new Map();
        async function getBlockTs(blockNumber) {
          if (blockTs.has(blockNumber)) return blockTs.get(blockNumber);
          const blk = await provider.getBlock(blockNumber);
          const ts = blk?.timestamp ? Number(blk.timestamp) : 0;
          blockTs.set(blockNumber, ts);
          return ts;
        }

        const fieldOwnerCache = new Map();
        async function resolveOwnerForField(fieldId) {
          const key = String(fieldId);
          if (fieldOwnerCache.has(key)) return fieldOwnerCache.get(key);
          try {
            const field = await contract.fields(fieldId);
            const owner = field?.owner ? String(field.owner).toLowerCase() : '';
            fieldOwnerCache.set(key, owner);
            return owner;
          } catch {
            fieldOwnerCache.set(key, '');
            return '';
          }
        }

        // For BookingConfirmed/Cancelled: event doesn't include owner. We'll enrich via bookings + fields.
        async function resolveOwnerForBooking(bookingId) {
          try {
            const booking = await contract.bookings(bookingId);
            const fieldId = Number(booking?.fieldId ?? 0);
            if (!fieldId) return '';
            return await resolveOwnerForField(fieldId);
          } catch {
            return '';
          }
        }

        const out = [];
        let totalIn = 0n;
        let totalOut = 0n;
        let totalCredited = 0n;
        let totalFee = 0n;

        for (const item of sliced) {
          const { name, log } = item;
          const args = log?.args || {};
          const txHash = log?.transactionHash;
          const blockNumber = log?.blockNumber;
          const ts = blockNumber ? await getBlockTs(blockNumber) : 0;

          let row = {
            key: `${name}:${txHash}:${log?.index ?? ''}`,
            time: ts ? new Date(ts * 1000).toLocaleString('vi-VN') : `Block #${blockNumber}`,
            type: name,
            detail: '',
            amountEth: '',
            direction: '',
            txHash,
            explorerUrl: NetworkConfig.getExplorerUrl(txHash || ''),
            highlight: false,
          };

          if (name === 'BookingCreated') {
            const bookingId = args?.bookingId;
            const fieldId = args?.fieldId;
            const user = args?.user ? String(args.user).toLowerCase() : '';
            const amount = args?.amount;
            row.type = '📥 Đặt sân (Thu vào contract)';
            row.detail = `Booking #${bookingId} • Sân ${fieldId} • User ${user ? user.slice(0, 10) + '...' : ''}`;
            row.amountEth = `${toEth(amount)} ETH`;
            row.direction = 'IN';
            if (mode === 'wallet' && lowerAddress) {
              const ownerLower = await resolveOwnerForField(fieldId);
              row.highlight = user === lowerAddress || (ownerLower && ownerLower === lowerAddress);
              if (!row.highlight) continue;
            }
            if (typeof amount === 'bigint') totalIn += amount;
          }

          if (name === 'BookingCancelled') {
            const bookingId = args?.bookingId;
            const user = args?.user ? String(args.user).toLowerCase() : '';
            const refundAmount = args?.refundAmount;
            row.type = '📤 Hủy đặt sân (Hoàn tiền)';
            row.detail = `Booking #${bookingId} • User ${user ? user.slice(0, 10) + '...' : ''}`;
            row.amountEth = `${toEth(refundAmount)} ETH`;
            row.direction = 'OUT';
            if (mode === 'wallet' && lowerAddress) {
              const ownerLower = await resolveOwnerForBooking(bookingId);
              row.highlight = user === lowerAddress || (ownerLower && ownerLower === lowerAddress);
              if (!row.highlight) continue;
            }
            if (typeof refundAmount === 'bigint') totalOut += refundAmount;
          }

          if (name === 'BookingConfirmed') {
            const bookingId = args?.bookingId;
            const ownerAmount = args?.ownerAmount;
            const feeAmount = args?.feeAmount;
            row.type = '✅ Xác nhận đặt sân';
            row.detail = `Booking #${bookingId} • +${toEth(ownerAmount)} ETH vào số dư rút • Phí nền tảng: ${toEth(feeAmount)} ETH`;
            row.amountEth = `${toEth(ownerAmount)} ETH`;
            row.direction = 'CREDIT';
            if (mode === 'wallet' && lowerAddress) {
              const ownerLower = await resolveOwnerForBooking(bookingId);
              row.highlight = ownerLower && ownerLower === lowerAddress;
              if (!row.highlight) continue;
            }

            if (typeof ownerAmount === 'bigint') totalCredited += ownerAmount;
            if (typeof feeAmount === 'bigint') totalFee += feeAmount;
          }

          if (name === 'BalanceWithdrawn') {
            const owner = args?.owner ? String(args.owner).toLowerCase() : '';
            const amount = args?.amount;
            row.type = '🏧 Rút tiền về ví';
            row.detail = `Owner ${owner ? owner.slice(0, 10) + '...' : ''}`;
            row.amountEth = `${toEth(amount)} ETH`;
            row.direction = 'OUT';
            if (mode === 'wallet' && lowerAddress) {
              row.highlight = owner === lowerAddress;
              if (!row.highlight) continue;
            }
            if (typeof amount === 'bigint') totalOut += amount;
          }

          if (name === 'FieldCreated' || name === 'FieldCreatedV2') {
            const fieldId = args?.fieldId;
            const fieldName = args?.name;
            const owner = args?.owner ? String(args.owner).toLowerCase() : '';
            row.type = '🏟️ Tạo sân';
            row.detail = `Sân ${fieldId} • ${fieldName || ''}`;
            row.amountEth = '';
            row.direction = 'INFO';
            if (mode === 'wallet' && lowerAddress) {
              row.highlight = owner === lowerAddress;
              if (!row.highlight) continue;
            }
          }

          if (name === 'FieldUpdated' || name === 'FieldUpdatedV2') {
            const fieldId = args?.fieldId;
            row.type = '✏️ Cập nhật sân';
            row.detail = `Sân ${fieldId}`;
            row.amountEth = '';
            row.direction = 'INFO';

            if (mode === 'wallet' && lowerAddress) {
              const ownerLower = await resolveOwnerForField(fieldId);
              row.highlight = ownerLower && ownerLower === lowerAddress;
              if (!row.highlight) continue;
            }
          }

          if (name === 'FieldStatusChanged') {
            const fieldId = args?.fieldId;
            const isActive = Boolean(args?.isActive);
            row.type = '🔄 Đổi trạng thái sân';
            row.detail = `Sân ${fieldId} • ${isActive ? '🟢 Mở' : '🔴 Tắt'}`;
            row.amountEth = '';
            row.direction = 'INFO';

            if (mode === 'wallet' && lowerAddress) {
              const ownerLower = await resolveOwnerForField(fieldId);
              row.highlight = ownerLower && ownerLower === lowerAddress;
              if (!row.highlight) continue;
            }
          }

          if (name === 'FieldDeleted') {
            const fieldId = args?.fieldId;
            const fieldName = args?.fieldName;
            row.type = '🗑️ Hủy sân';
            row.detail = `Sân ${fieldId} • ${fieldName || ''}`;
            row.amountEth = '';
            row.direction = 'INFO';

            if (mode === 'wallet' && lowerAddress) {
              const ownerLower = await resolveOwnerForField(fieldId);
              row.highlight = ownerLower && ownerLower === lowerAddress;
              if (!row.highlight) continue;
            }
          }

          out.push(row);
          if (out.length >= limit) break;
        }

        if (cancelled) return;

        setRows(out);
        setSummary({
          inEth: ethers.formatEther(totalIn),
          outEth: ethers.formatEther(totalOut),
          creditedEth: ethers.formatEther(totalCredited),
          feeEth: ethers.formatEther(totalFee),
        });
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Không thể tải lịch sử giao dịch');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [contract, lowerAddress, mode, limit, lookbackBlocks]);

  if (!contract) return null;

  return (
    <div className="tx-history">
      <div className="tx-history-header">
        <h3>📜 Lịch sử giao dịch</h3>
        <div className="tx-history-sub">
          <span>Thu (booking): <strong>{Number(summary.inEth).toFixed(4)} ETH</strong></span>
          <span>Chi (refund/withdraw): <strong>{Number(summary.outEth).toFixed(4)} ETH</strong></span>
          <span>Tín dụng vào số dư rút (confirm): <strong>{Number(summary.creditedEth).toFixed(4)} ETH</strong></span>
          <span>Phí nền tảng (5%): <strong>{Number(summary.feeEth).toFixed(4)} ETH</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="tx-history-loading">⏳ Đang tải lịch sử...</div>
      ) : error ? (
        <div className="tx-history-error">⚠️ {error}</div>
      ) : rows.length === 0 ? (
        <div className="tx-history-empty">Chưa có giao dịch trong khoảng quét gần đây.</div>
      ) : (
        <div className="tx-history-table-wrap">
          <table className="tx-history-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sự kiện</th>
                <th>Chi tiết</th>
                <th>Số tiền</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} className={r.highlight ? 'highlight' : ''}>
                  <td className="mono">{r.time}</td>
                  <td>{r.type}</td>
                  <td>{r.detail}</td>
                  <td className={`mono amount ${r.direction === 'IN' ? 'in' : r.direction === 'OUT' ? 'out' : ''}`}>{r.amountEth || '-'}</td>
                  <td className="mono">
                    {r.txHash ? (
                      <a href={r.explorerUrl} target="_blank" rel="noreferrer">{shortHash(r.txHash)}</a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tx-history-note">
            * Lịch sử dựa trên event on-chain trong ~{lookbackBlocks.toLocaleString('vi-VN')} blocks gần nhất.
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
