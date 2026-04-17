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
  const [selectedRole, setSelectedRole] = useState('user');
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

      // Đăng nhập
      console.log('[Login] Logging in with role:', selectedRole);
      const user = AuthService.login(selectedAddress, selectedRole, contractData);

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
            <h2>📋 Chọn vai trò của bạn</h2>
            
            <NetworkCheck />
            
            <div className="role-selector">
              <label className={`role-option ${selectedRole === 'user' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={selectedRole === 'user'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                />
                <span className="role-icon">👤</span>
                <div>
                  <strong>Người Dùng</strong>
                  <small>Đặt sân và quản lý booking</small>
                </div>
              </label>

              <label className={`role-option ${selectedRole === 'admin' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                />
                <span className="role-icon">👨‍💼</span>
                <div>
                  <strong>Chủ Sân (Admin)</strong>
                  <small>Tạo và quản lý sân</small>
                </div>
              </label>
            </div>

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
                <li>✅ Sử dụng MetaMask Localhost Network (31337)</li>
                <li>✅ Mỗi tài khoản có 10000 ETH test</li>
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
