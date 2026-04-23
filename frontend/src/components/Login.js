/**
 * Login Component
 * Demo mode: mọi ví đăng nhập đều là Admin (để demo dễ dàng)
 */

import React, { useState } from 'react';
import ContractService from '../services/ContractService';
import AuthService from '../services/AuthService';
import WalletSelector from './WalletSelector';
import NetworkCheck from './NetworkCheck';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const handleWalletSelect = async (selectedAddress) => {
    setLoading(true);
    setError('');
    try {
      setWalletAddress(selectedAddress);
      setShowWalletSelector(false);

      // Connect contract with selected address
      const contractData = await ContractService.connectWallet(selectedAddress);
      let isAdmin = false;
      try {
        const contract = contractData?.contract;
        if (contract) {
          if (typeof contract.isAdmin === 'function') {
            try {
              isAdmin = await contract.isAdmin(selectedAddress);
            } catch (e) {
              const ownerAddress = await contract.platformOwner();
              if (ownerAddress && String(ownerAddress).toLowerCase() === String(selectedAddress).toLowerCase()) {
                isAdmin = true;
              }
            }
          } else if (typeof contract.admins === 'function') {
            try {
              isAdmin = await contract.admins(selectedAddress);
            } catch (e) {
              const ownerAddress = await contract.platformOwner();
              if (ownerAddress && String(ownerAddress).toLowerCase() === String(selectedAddress).toLowerCase()) {
                isAdmin = true;
              }
            }
          } else {
            const ownerAddress = await contract.platformOwner();
            if (ownerAddress && String(ownerAddress).toLowerCase() === String(selectedAddress).toLowerCase()) {
              isAdmin = true;
            }
          }
        }
      } catch (e) {
        // ignore
      }

      // Log admin status for debugging
      console.log('[Login] Wallet admin status check:', { selectedAddress, isAdmin });

      // Demo requirement: mọi ví đều vào Admin UI
      const role = 'admin';

      const user = AuthService.login(selectedAddress, role, contractData);
      if (onLoginSuccess) onLoginSuccess(user, contractData);
    } catch (error) {
      console.error('[Login] Error:', error);
      setError(error.message || 'Lỗi đăng nhập');
      setWalletAddress('');
    } finally {
      setLoading(false);
    }
  };



  const handleOpenWalletSelector = () => {
    setShowWalletSelector(true);
  };

  const handleCloseWalletSelector = () => {
    console.log('[Login] Closing wallet selector...');
    setShowWalletSelector(false);
  };

  return (
    <>
      {showWalletSelector && (
        <WalletSelector 
          onSelectWallet={handleWalletSelect}
          onCancel={handleCloseWalletSelector}
        />
      )}

      <div className="login-container">
        <div className="login-card">
          <h1>🏟️ FieldBooking</h1>
          <p className="subtitle">Hệ thống đặt sân thể thao trên Blockchain</p>

          <div className="login-content">
            <h2>📋 Đăng nhập</h2>
            <NetworkCheck />

            <div className="info-box" style={{ marginTop: '12px' }}>
              <h3>✅ Chế độ Demo</h3>
              <ul>
                <li>✅ Mọi ví đăng nhập đều có quyền Admin</li>
                <li>✅ Dùng để demo/test nhanh trên Hardhat</li>
              </ul>
            </div>

            <button 
              className="connect-btn"
              onClick={handleOpenWalletSelector}
              disabled={loading}
            >
              {loading ? (
                <>⏳ Đang đăng nhập...</>
              ) : walletAddress ? (
                <>🦊 Đổi Ví</>
              ) : (
                <>🦊 Chọn Ví & Đăng Nhập</>
              )}
            </button>

            {walletAddress && (
              <div className="wallet-preview">
                <p>💼 Ví đã kết nối:</p>
                <code>{walletAddress.substring(0, 10)}...{walletAddress.substring(38)}</code>
              </div>
            )}

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <div className="info-box">
              <h3>ℹ️ Hướng dẫn</h3>
              <ul>
                <li>✅ Bấm "Chọn Ví & Đăng Nhập"</li>
                <li>✅ MetaMask phải đúng network theo app</li>
                <li>✅ Khi thao tác, smart contract sẽ xác thực quyền thực tế (msg.sender)</li>
                <li>✅ Nếu không có quyền, contract sẽ từ chối giao dịch</li>
                <li>✅ Nếu demo từ máy khác: nhớ import ví có ETH (Hardhat prefunded)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
