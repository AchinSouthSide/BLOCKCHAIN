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
  const [loginMode, setLoginMode] = useState('user'); // 'admin' | 'user'

  const normalizeAddress = (addr) => String(addr || '').trim().toLowerCase();

  const isUiAdminAddress = (addr, isAdminOnChain) => {
    const envAdmin = normalizeAddress(process.env.REACT_APP_ADMIN_ADDRESS);
    if (envAdmin) return normalizeAddress(addr) === envAdmin;
    return Boolean(isAdminOnChain);
  };

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

      // UI rule: chỉ ví Admin (on-chain hoặc cấu hình REACT_APP_ADMIN_ADDRESS) mới vào được giao diện Admin
      const canAccessAdminUi = isUiAdminAddress(selectedAddress, isAdmin);
      const requestedRole = loginMode === 'admin' ? 'admin' : 'user';
      const role = canAccessAdminUi ? requestedRole : 'user';
      if (!canAccessAdminUi && loginMode === 'admin') {
        setLoginMode('user');
        setError('Ví này không có quyền Admin. Hệ thống sẽ đăng nhập ở chế độ Người dùng (User).');
      }

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
            <h2>📋 Chọn vai trò của bạn</h2>
            <NetworkCheck />

            {/* Lựa chọn vai trò rõ ràng với hiệu ứng */}
            <div className="role-selector">
              <label
                className={`role-option ${loginMode === 'admin' ? 'selected' : ''}`}
                onClick={() => !loading && setLoginMode('admin')}
              >
                <div className="role-icon">👨‍💼</div>
                <div>
                  <strong>Quản lý (Admin)</strong>
                  <small>Tạo sân, quản lý đặt, rút doanh thu</small>
                </div>
              </label>
              <label
                className={`role-option ${loginMode === 'user' ? 'selected' : ''}`}
                onClick={() => !loading && setLoginMode('user')}
              >
                <div className="role-icon">👤</div>
                <div>
                  <strong>Người dùng (User)</strong>
                  <small>Duyệt sân, đặt sân, xem lịch của tôi</small>
                </div>
              </label>
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
                <li>✅ Chọn vai trò bạn muốn vào</li>
                <li>✅ Chỉ ví có quyền Admin mới vào giao diện Admin</li>
                <li>✅ Khi thao tác, smart contract sẽ xác thực quyền thực tế (msg.sender)</li>
                <li>✅ Nếu không có quyền, contract sẽ từ chối giao dịch</li>
                <li>✅ Bạn có thể thay đổi vai trò bất cứ lúc nào</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
