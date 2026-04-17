/**
 * Login Component
 * Cho phép user chọn wallet, sau đó chọn role (Admin/User)
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
    console.log('[Login] Wallet selected:', selectedAddress);
    setLoading(true);
    setError('');
    try {
      setWalletAddress(selectedAddress);
      setShowWalletSelector(false);

      // Connect contract with selected address (pass it so we don't show MetaMask modal again)
      console.log('[Login] Connecting to contract with address:', selectedAddress);
      const contractData = await ContractService.connectWallet(selectedAddress);

      // Lock role: admin is determined on-chain (platformOwner OR delegated admins)
      let role = 'user';
      try {
        const contract = contractData?.contract;
        if (contract) {
          // Preferred: new contract API
          if (typeof contract.isAdmin === 'function') {
            try {
              const isAdmin = await contract.isAdmin(selectedAddress);
              if (isAdmin) role = 'admin';
            } catch (e) {
              const ownerAddress = await contract.platformOwner();
              if (
                ownerAddress &&
                String(ownerAddress).toLowerCase() === String(selectedAddress).toLowerCase()
              ) {
                role = 'admin';
              }
            }
          } else if (typeof contract.admins === 'function') {
            try {
              const isAdmin = await contract.admins(selectedAddress);
              if (isAdmin) role = 'admin';
            } catch (e) {
              const ownerAddress = await contract.platformOwner();
              if (
                ownerAddress &&
                String(ownerAddress).toLowerCase() === String(selectedAddress).toLowerCase()
              ) {
                role = 'admin';
              }
            }
          } else {
            // Backward-compatible: old contract API
            const ownerAddress = await contract.platformOwner();
            if (
              ownerAddress &&
              String(ownerAddress).toLowerCase() === String(selectedAddress).toLowerCase()
            ) {
              role = 'admin';
            }
          }
        }
      } catch (e) {
        console.warn('[Login] Could not determine admin role from contract; defaulting to user:', e?.message || e);
      }

      // Đăng nhập
      console.log('[Login] Logging in with role:', role);
      const user = AuthService.login(selectedAddress, role, contractData);

      console.log('[Login] Login successful:', user);
      
      // Callback - Pass both user AND contractData
      if (onLoginSuccess) {
        onLoginSuccess(user, contractData);
      }

    } catch (error) {
      console.error('[Login] Error:', error);
      setError(error.message || 'Lỗi đăng nhập');
      setWalletAddress('');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWalletSelector = () => {
    console.log('[Login] Opening wallet selector...');
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

            {walletAddress && (
              <div className="wallet-preview">
                <p>💼 Ví đã kết nối:</p>
                <code>{walletAddress.substring(0, 10)}...{walletAddress.substring(38)}</code>
              </div>
            )}

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

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <div className="info-box">
              <h3>ℹ️ Thông tin</h3>
              <ul>
                <li>✅ Quyền Admin được xác định tự động theo smart contract (platformOwner hoặc ví được cấp quyền)</li>
                <li>✅ Bạn có thể dùng Hardhat local hoặc mạng khác (nếu đã deploy contract)</li>
                <li>✅ Chọn ví trước khi đăng nhập</li>
                <li>✅ Bạn có thể chuyển đổi tài khoản bất cứ lúc nào</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
