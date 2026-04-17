/**
 * Login Component
 * Cho phép user đăng nhập MetaMask và chọn role (Admin/User)
 */

import React, { useState } from 'react';
import ContractService from '../services/ContractService';
import AuthService from '../services/AuthService';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[Login] Starting MetaMask connection...');
      
      // Check MetaMask
      if (!window.ethereum) {
        throw new Error('❌ MetaMask không cài đặt. Vui lòng cài MetaMask extension.');
      }

      console.log('[Login] Requesting accounts...');
      // Request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('❌ Không nhận được account từ MetaMask');
      }

      const address = accounts[0];
      console.log('[Login] Account connected:', address);
      setWalletAddress(address);

      // Connect contract
      console.log('[Login] Connecting to contract...');
      const contractData = await ContractService.connectWallet();

      // Đăng nhập
      console.log('[Login] Logging in with role:', selectedRole);
      const user = AuthService.login(address, selectedRole, contractData);

      console.log('[Login] Login successful:', user);
      
      // Callback
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }

    } catch (error) {
      console.error('[Login] Error:', error);
      setError(error.message || 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏟️ FieldBooking</h1>
        <p className="subtitle">Hệ thống đặt sân thể thao trên Blockchain</p>

        <div className="login-content">
          <h2>📋 Chọn vai trò của bạn</h2>
          
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
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <>⏳ Đang kết nối...</>
            ) : (
              <>🦊 Kết nối MetaMask & Đăng Nhập</>
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
              <li>✅ Dữ liệu tự động lưu sau khi đăng nhập</li>
              <li>✅ Bạn có thể chuyển đổi tài khoản bất cứ lúc nào</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
