/**
 * Admin Dashboard Component
 * Platform admin có toàn quyền quản lý
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractService from '../services/ContractService';
import OwnerDashboard from './OwnerDashboard';
import CreateField from './CreateField';
import Balance from './Balance';
import '../styles/Dashboard.css';

function AdminDashboard({ contract, user }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [allFields, setAllFields] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalFields: 0,
    totalBookings: 0,
    totalRevenue: '0'
  });

  useEffect(() => {
    console.log('[AdminDashboard] Loaded with user:', user?.address);
    if (contract && user) {
      loadAdminData();
    }
  }, [contract, user]);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Load all fields
      const fields = await ContractService.getAllFields(contract);
      console.log('[AdminDashboard] Fields loaded:', fields);
      
      // Filter out deleted fields (id = 0)
      const validFields = fields.filter(f => f && f.id !== 0);
      setAllFields(validFields);

      // Load all bookings for each field
      const allBookingsData = [];
      for (const field of validFields) {
        try {
          const bookings = await ContractService.getFieldBookings(contract, field.id);
          allBookingsData.push(...bookings.map(b => ({ 
            ...b, 
            fieldName: field.name || 'Unknown',
            fieldId: field.id 
          })));
        } catch (e) {
          console.warn(`[AdminDashboard] Error loading bookings for field ${field.id}:`, e);
        }
      }
      console.log('[AdminDashboard] Bookings loaded:', allBookingsData);
      setAllBookings(allBookingsData);

      // Get platform earnings
      try {
        const platformEarnings = await contract.platformEarnings();
        const formattedEarnings = ethers.formatEther(platformEarnings);
        
        setPlatformStats({
          totalFields: validFields.length,
          totalBookings: allBookingsData.length,
          totalRevenue: formattedEarnings
        });
      } catch (e) {
        console.warn('Could not fetch platform earnings:', e.message);
        setPlatformStats({
          totalFields: validFields.length,
          totalBookings: allBookingsData.length,
          totalRevenue: '0'
        });
      }
    } catch (error) {
      console.error('[AdminDashboard] Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>👨‍💼 Admin Dashboard - DApp Đặt Sân Thể Thao</h2>
        <p>Quản lý toàn bộ hệ thống booking sân thể thao</p>
      </div>

      <div className="dashboard-actions">
        <button
          className={`action-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
          disabled={isLoading}
        >
          📊 Tổng Quan
        </button>
        <button
          className={`action-btn ${activeSection === 'all-fields' ? 'active' : ''}`}
          onClick={() => { setActiveSection('all-fields'); loadAdminData(); }}
          disabled={isLoading}
        >
          🏟️ Duyệt Sân ({platformStats.totalFields})
        </button>
        <button
          className={`action-btn ${activeSection === 'all-bookings' ? 'active' : ''}`}
          onClick={() => setActiveSection('all-bookings')}
          disabled={isLoading}
        >
          📅 Tất Cả Đặt Sân ({platformStats.totalBookings})
        </button>
        <button
          className={`action-btn ${activeSection === 'my-fields' ? 'active' : ''}`}
          onClick={() => setActiveSection('my-fields')}
          disabled={isLoading}
        >
          📋 Sân Của Tôi
        </button>
        <button
          className={`action-btn ${activeSection === 'create-field' ? 'active' : ''}`}
          onClick={() => setActiveSection('create-field')}
          disabled={isLoading}
        >
          ➕ Tạo Sân
        </button>
        <button
          className={`action-btn ${activeSection === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveSection('balance')}
          disabled={isLoading}
        >
          💰 Tài Khoản
        </button>
      </div>

      <div className="dashboard-sections">
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
            <p>⏳ Đang tải...</p>
          </div>
        )}

        {/* ===== OVERVIEW ===== */}
        {!isLoading && activeSection === 'overview' && (
          <div className="section-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏟️</div>
                <div className="stat-content">
                  <h4>Tổng Sân</h4>
                  <p className="stat-value">{platformStats.totalFields}</p>
                  <p className="stat-desc">sân đang hoạt động</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h4>Tổng Đặt Sân</h4>
                  <p className="stat-value">{platformStats.totalBookings}</p>
                  <p className="stat-desc">lượt đặt sân</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h4>Doanh Thu Platform</h4>
                  <p className="stat-value">{platformStats.totalRevenue}</p>
                  <p className="stat-desc">ETH (5% từ mỗi booking)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== BROWSE ALL FIELDS ===== */}
        {!isLoading && activeSection === 'all-fields' && (
          <div className="section-all-fields">
            <h3>🏟️ Duyệt Tất Cả Sân Trong Hệ Thống</h3>
            {allFields.length === 0 ? (
              <div className="no-data">Chưa có sân nào trong hệ thống</div>
            ) : (
              <div className="fields-browse-grid">
                {allFields.map(field => (
                  <div key={field.id} className="field-browse-card">
                    <div className="field-browse-header">
                      <h4>🏟️ {field.name || 'N/A'}</h4>
                      <span className={`status-badge ${field.isActive ? 'active' : 'inactive'}`}>
                        {field.isActive ? '✅ Hoạt động' : '🚫 Tắt'}
                      </span>
                    </div>
                    <p className="location">📍 {field.location || 'N/A'}</p>
                    <p className="description">{field.description || 'N/A'}</p>
                    <div className="field-info-row">
                      <span>💵 {field.pricePerHour || '0'} ETH/giờ</span>
                      <span>👤 {field.owner ? `${field.owner.slice(0, 8)}...${field.owner.slice(-4)}` : 'Unknown'}</span>
                    </div>
                    <div className="booking-count">
                      📅 {allBookings.filter(b => b.fieldId === field.id).length} lượt đặt
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ALL BOOKINGS ===== */}
        {!isLoading && activeSection === 'all-bookings' && (
          <div className="section-all-bookings">
            <h3>📅 Tất Cả Đặt Sân Trong Hệ Thống</h3>
            {allBookings.length === 0 ? (
              <div className="no-data">Chưa có đặt sân nào</div>
            ) : (
              <div className="bookings-list">
                {allBookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <h5>Đặt Sân #{booking.id}</h5>
                      <p>🏟️ <strong>{booking.fieldName || 'N/A'}</strong></p>
                      <p>👤 {booking.user ? `${booking.user.slice(0, 8)}...${booking.user.slice(-4)}` : 'Unknown'}</p>
                      <p>💰 {booking.amountPaid || '0'} ETH</p>
                      <p>📅 {booking.startTime ? new Date(booking.startTime * 1000).toLocaleString('vi-VN') : 'N/A'}</p>
                      <span className={`status-badge ${booking.status === 0 ? 'pending' : booking.status === 1 ? 'confirmed' : booking.status === 2 ? 'cancelled' : 'unknown'}`}>
                        {booking.status === 0 && '⏳ Chờ xác nhận'}
                        {booking.status === 1 && '✅ Đã xác nhận'}
                        {booking.status === 2 && '❌ Đã huỷ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MY FIELDS ===== */}
        {!isLoading && activeSection === 'my-fields' && (
          <OwnerDashboard contract={contract} userAddress={user.address} />
        )}

        {!isLoading && activeSection === 'create-field' && (
          <CreateField contract={contract} onSuccess={() => { loadAdminData(); setActiveSection('my-fields'); }} />
        )}

        {!isLoading && activeSection === 'balance' && (
          <Balance contract={contract} userAddress={user.address} isPlatformOwner={false} />
        )}
      </div>
    </div>
  );
}


export default AdminDashboard;
