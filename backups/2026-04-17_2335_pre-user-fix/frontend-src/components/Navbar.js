/**
 * Navbar Component
 * Hiển thị thông tin user và còis logout
 */

import React from 'react';
import '../styles/Navbar.css';

function Navbar({ user, onLogout }) {
  if (!user) return null;

  const shortAddress = `${user.address.substring(0, 6)}...${user.address.substring(38)}`;
  const roleDisplay = user.role === 'admin' ? '👨‍💼 Admin' : '👤 User';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>🏟️ FieldBooking</h1>
        <p>Hệ thống đặt sân trên Blockchain</p>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <span className="role">{roleDisplay}</span>
          <span className="address" title={user.address}>{shortAddress}</span>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          🚪 Đăng Xuất
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
