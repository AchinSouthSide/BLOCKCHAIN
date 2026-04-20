import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService';
import '../styles/Balance.css';

function Balance({ contract, userAddress, isPlatformOwner }) {
  const [earnings, setEarnings] = useState('0');
  const [totalRevenue, setTotalRevenue] = useState('0');
  const [contractBalance, setContractBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (contract && userAddress) {
      loadEarnings();
      const interval = setInterval(loadEarnings, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [contract, userAddress]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      console.log('[Balance] Loading earnings for:', userAddress);

      // getAdminSummary() returns wallet-specific withdrawable balance as adminBalance
      // plus global totals (confirmed bookings, total revenue, contract balance)
      const summary = await ContractService.getAdminSummary(contract);
      setEarnings(summary.adminBalance || '0');
      setTotalRevenue(summary.totalRevenue || '0');
      setContractBalance(summary.contractTotalBalance || '0');
    } catch (error) {
      console.error('[Balance] Error loading earnings:', error);
      setEarnings('0');
      setTotalRevenue('0');
      setContractBalance('0');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (parseFloat(earnings) === 0) {
      alert('Chưa có doanh thu để rút');
      return;
    }

    if (!window.confirm(`Rút ${earnings} ETH từ doanh thu của bạn?`)) {
      return;
    }

    try {
      setWithdrawing(true);
      await ContractService.withdrawBalance(contract);
      alert('Rút tiền thành công! ✅');
      await loadEarnings();
    } catch (error) {
      alert('Error withdrawing: ' + error.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="balance-loading">⏳ Đang tải...</div>;

  return (
    <div className="balance-container">
      {/* ===== USER EARNINGS ===== */}
      <div className="earnings-card">
        <div className="earnings-header">
          <h3>💰 Doanh thu của bạn</h3>
          <span className="earnings-amount">{earnings} ETH</span>
          <p>Đây là số dư có thể rút về ví hiện tại</p>
          <p style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
            Tổng doanh thu (confirmed): <strong>{totalRevenue} ETH</strong> • Tổng số dư contract: <strong>{contractBalance} ETH</strong>
          </p>
        <div className="earnings-info">
          <p>Tiền kiếm được từ việc cho thuê sân</p>
        </div>
        <button 
          className="withdraw-btn"
          onClick={handleWithdraw}
          disabled={parseFloat(earnings) === 0 || withdrawing}
        >
          {withdrawing ? '⏳ Đang rút...' : '🏦 Rút tiền'}
        </div>
      )}

      {/* ===== INFO ===== */}
      <div className="balance-info">
        <h4>ℹ️ Thông tin</h4>
        <ul>
          <li>Doanh thu được tính toán khi đặt sân được hoàn thành</li>
          <li>Bạn có thể rút tiền bất cứ lúc nào khi có doanh thu</li>
          <li>Phí đơn vị là 5% cho mỗi giao dịch</li>
          <li>Tiền sẽ được chuyển trực tiếp vào ví MetaMask của bạn</li>
        </ul>
      </div>
    </div>
  );
}

export default Balance;
