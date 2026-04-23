/**
 * Network Checker Component
 * Kiểm tra xem đang kết nối network nào
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ethereumRequest } from '../utils/ethereumRequest';

function NetworkCheck() {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [error, setError] = useState('');

  const checkNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask chưa được cài đặt');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const accounts = await ethereumRequest({ method: 'eth_accounts' });

      const chainIdNumber = Number(network.chainId);
      const rawExpected = process.env.REACT_APP_NETWORK_ID;
      const expectedChainId = rawExpected
        ? Number.parseInt(String(rawExpected), 10)
        : null;
      const expectedChainIdSafe = Number.isFinite(expectedChainId) ? expectedChainId : null;
      const isExpectedNetwork = expectedChainIdSafe ? chainIdNumber === expectedChainIdSafe : true;

      console.log('[NetworkCheck] Current Network:', network);
      console.log('[NetworkCheck] Chain ID:', chainIdNumber);
      console.log('[NetworkCheck] Network Name:', network.name);
      console.log('[NetworkCheck] Connected Accounts:', accounts);

      setNetworkInfo({
        chainId: chainIdNumber,
        name: network.name,
        isFree: chainIdNumber === 31337,
        expectedChainId: expectedChainIdSafe,
        isExpectedNetwork,
        accounts: accounts.length,
        status: isExpectedNetwork ? '✅ Đúng network' : '⚠️ Sai network so với cấu hình app',
      });

      if (!isExpectedNetwork) {
        console.warn('[NetworkCheck] ⚠️ Network mismatch', { chainIdNumber, expectedChainId: expectedChainIdSafe });
      }
    } catch (err) {
      console.error('[NetworkCheck] Error:', err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    checkNetwork();
    // Lắng nghe thay đổi network
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
      return () => window.ethereum.removeListener('chainChanged', checkNetwork);
    }
  }, [checkNetwork]);

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

  const ok = networkInfo.isExpectedNetwork;
  const bgColor = ok ? '#e8f5e9' : '#fff3e0';
  const borderColor = ok ? '#4caf50' : '#ff9800';

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
      {networkInfo.expectedChainId && (
        <div>
          🎯 Expected ChainID: {networkInfo.expectedChainId}
        </div>
      )}
      <div>
        👥 Accounts: {networkInfo.accounts}
      </div>
      {!networkInfo.isExpectedNetwork && (
        <div style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '4px' }}>
          ⚠️ CẢNH BÁO: Network hiện tại không đúng so với cấu hình app.
        </div>
      )}
    </div>
  );
}

export default NetworkCheck;
