import React, { useState } from 'react';
import ContractService from '../services/ContractService';
import '../styles/WalletConnect.css';

function WalletConnect({ isConnected, userAddress, onConnect }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await onConnect();
    } catch (error) {
      alert('Error connecting wallet: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <span className="status">✅ Đã kết nối</span>
          <span className="address">{userAddress.substring(0, 6)}...{userAddress.substring(38)}</span>
        </div>
      ) : (
        <button 
          className="connect-btn"
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? 'Đang kết nối...' : 'Kết nối MetaMask'}
        </button>
      )}
    </div>
  );
}

export default WalletConnect;
