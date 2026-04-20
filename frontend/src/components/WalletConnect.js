import React, { useState } from 'react';
import '../styles/WalletConnect.css';
import { ethereumRequest, formatMetaMaskError } from '../utils/ethereumRequest';

function WalletConnect({ isConnected, userAddress, onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[WalletConnect] Starting connection...');
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask không được cài đặt. Vui lòng cài MetaMask extension trước.');
      }
      console.log('[WalletConnect] MetaMask found');
      
      // Request permissions
      console.log('[WalletConnect] Requesting account access...');
      const accounts = await ethereumRequest({
        method: 'eth_requestAccounts'
      }).catch(err => {
        console.error('[WalletConnect] MetaMask request failed:', err);
        throw new Error(formatMetaMaskError(err));
      });
      
      console.log('[WalletConnect] Accounts received:', accounts);
      
      // Connect to contract
      console.log('[WalletConnect] Connecting to contract...');
      await onConnect();
      console.log('[WalletConnect] Connection successful!');
      
    } catch (error) {
      console.error('[WalletConnect] Error:', error);
      setError(error.message || 'Lỗi kết nối ví');
      alert('❌ ' + (error.message || 'Lỗi kết nối ví'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <span className="status">✅ Đã kết nối</span>
          <span className="address">{userAddress.substring(0, 6)}...{userAddress.substring(38)}</span>
        </div>
      ) : (
        <div>
          <button 
            className="connect-btn"
            onClick={handleConnect}
            disabled={loading}
            title="Nhấn để kết nối MetaMask"
          >
            {loading ? '⏳ Đang kết nối...' : '🦊 Kết nối MetaMask'}
          </button>
          {error && <div className="error-message">❌ {error}</div>}
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
