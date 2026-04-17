/**
 * Network Checker Component
 * Kiểm tra xem đang kết nối network nào
 */

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

function NetworkCheck() {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkNetwork();
    // Lắng nghe thay đổi network
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
      return () => window.ethereum.removeListener('chainChanged', checkNetwork);
    }
  }, []);

  const checkNetwork = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask chưa được cài đặt');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      console.log('[NetworkCheck] Current Network:', network);
      console.log('[NetworkCheck] Chain ID:', network.chainId);
      console.log('[NetworkCheck] Network Name:', network.name);
      console.log('[NetworkCheck] Connected Accounts:', accounts);

  const isFree = network.chainId === 31337 || network.chainId === 'unknown'; // Allow unknown (might be local)

      setNetworkInfo({
        chainId: network.chainId,
        name: network.name,
        isFree: network.chainId === 31337, // Only true if explicitly Hardhat
        rpc: network.rpcUrl,
        accounts: accounts.length,
        status: (network.chainId === 31337) ? '✅ Miễn phí (Gas = 0)' : '⚠️ May have gas fees',
      });

      if (network.chainId !== 31337 && network.chainId !== 'unknown') {
        console.warn(
          '[NetworkCheck] ⚠️ Not on Hardhat Local.',
          'ChainID: ' + network.chainId
        );
      }
    } catch (err) {
      console.error('[NetworkCheck] Error:', err);
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div style={{
        padding: '12px',
        background: '#ffe0e0',
        color: '#d03c3c',
        borderRadius: '6px',
        fontSize: '12px',
        margin: '8px 0'
      }}>
        ❌ {error}
      </div>
    );
  }

  if (!networkInfo) {
    return (
      <div style={{
        padding: '12px',
        background: '#f0f0f0',
        color: '#666',
        borderRadius: '6px',
        fontSize: '12px',
        margin: '8px 0'
      }}>
        Đang kiểm tra network...
      </div>
    );
  }

  const bgColor = networkInfo.isFree ? '#e8f5e9' : '#fff3e0';
  const borderColor = networkInfo.isFree ? '#4caf50' : '#ff9800';

  return (
    <div
      style={{
        padding: '12px',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        fontSize: '12px',
        margin: '8px 0',
        fontFamily: 'monospace',
      }}
    >
      <div>
        {networkInfo.status}
      </div>
      <div>
        🔗 Network: {networkInfo.name} (ChainID: {networkInfo.chainId})
      </div>
      <div>
        👥 Accounts: {networkInfo.accounts}
      </div>
      {!networkInfo.isFree && (
        <div style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '4px' }}>
          ⚠️ CẢNH BÁO: Đang dùng network có phí! Chuyển sang Hardhat Local!
        </div>
      )}
    </div>
  );
}

export default NetworkCheck;
