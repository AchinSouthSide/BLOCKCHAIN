import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ContractService from '../services/ContractService';
import TransactionHistory from './TransactionHistory';
import '../styles/OwnerDashboard.css';

function OwnerDashboard({ contract, userAddress }) {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldBookings, setFieldBookings] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editFormData, setEditFormData] = useState({
    pricePerHour: ''
  });
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState('0');

  useEffect(() => {
    if (contract && userAddress) {
      loadOwnerData();
    }
  }, [contract, userAddress]);

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      console.log('[OwnerDashboard] Loading owner data...');
      
      const fieldsData = await ContractService.getFieldsWithStats(contract);
      console.log('[OwnerDashboard] Fields loaded:', fieldsData.length);
      setFields(fieldsData);
      
      // Withdrawable balance for platform owner
      const balanceEth = await ContractService.getBalance(contract, userAddress);
      console.log('[OwnerDashboard] Balance loaded:', balanceEth);
      setEarnings(balanceEth);
    } catch (error) {
      console.error('[OwnerDashboard] Error loading data:', error);
      // Don't alert on initial load - fields might be empty
      setFields([]);
      setEarnings('0');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectField = async (field) => {
    try {
      console.log('[OwnerDashboard] Loading bookings for field:', field.id);
      setSelectedField(field);
      const bookings = await ContractService.getFieldBookings(contract, field.id);
      console.log('[OwnerDashboard] Bookings loaded:', bookings.length);
      setFieldBookings(bookings);
    } catch (error) {
      console.error('[OwnerDashboard] Error loading field bookings:', error);
      alert('Lỗi khi tải đặt sân: ' + error.message);
    }
  };

  const handleEditField = (field) => {
    setEditingField(field.id);
    setEditFormData({
      pricePerHour: field.pricePerHour
    });
  };

  const handleUpdateField = async () => {
    if (!editFormData.pricePerHour) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const newPriceWei = ethers.parseEther(String(editFormData.pricePerHour));
      await ContractService.updateFieldPrice(contract, editingField, newPriceWei);
      alert('Cập nhật giá sân thành công! ✅');
      setEditingField(null);
      loadOwnerData();
    } catch (error) {
      alert('Lỗi cập nhật giá sân: ' + error.message);
    }
  };

  const handleToggleStatus = async (fieldId) => {
    try {
      await ContractService.toggleFieldStatus(contract, fieldId);
      alert('Cập nhật trạng thái sân thành công! ✅');
      loadOwnerData();
    } catch (error) {
      alert('Lỗi cập nhật trạng thái sân: ' + error.message);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleConfirmBooking = async (bookingId) => {
    if (window.confirm('Xác nhận đặt sân này?')) {
      try {
        await ContractService.confirmBooking(contract, bookingId);
        alert('Đã xác nhận đặt sân! ✅');
        const bookings = await ContractService.getFieldBookings(contract, selectedField.id);
        setFieldBookings(bookings);
      } catch (error) {
        alert('Lỗi xác nhận đặt sân: ' + error.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 0) return <span className="status-badge pending">⏳ Chờ xác nhận</span>;
    if (status === 1) return <span className="status-badge confirmed">✅ Đã xác nhận</span>;
    if (status === 2) return <span className="status-badge cancelled">❌ Đã huỷ</span>;
    return <span className="status-badge unknown">❔ Không xác định</span>;
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div className="owner-dashboard-container">
      {/* ===== OWNER EARNINGS ===== */}
      <div className="earnings-card">
        <div className="earnings-info">
          <h3>💰 Số dư có thể rút</h3>
          <p className="earnings-amount">{earnings} ETH</p>
        </div>
        <button 
          className="withdraw-btn"
          onClick={() => {
            if (window.confirm(`Rút ${earnings} ETH?`)) {
              ContractService.withdrawBalance(contract)
                .then(() => {
                  alert('Rút tiền thành công! ✅');
                  loadOwnerData();
                })
                .catch(err => alert('Error: ' + err.message));
            }
          }}
          disabled={parseFloat(earnings) === 0}
        >
          🏦 Rút tiền
        </button>
      </div>

      <TransactionHistory
        contract={contract}
        address={userAddress}
        mode="wallet"
        limit={25}
        lookbackBlocks={30000}
      />

      {/* ===== FIELDS LIST ===== */}
      <div className="fields-management">
        <h2>🏟️ Sân của bạn ({fields.length})</h2>
        
        {fields.length === 0 ? (
          <div className="no-data">Bạn chưa tạo sân nào</div>
        ) : (
          <div className="fields-list">
            {fields.map(field => (
              <div key={field.id} className={`field-item ${editingField === field.id ? 'editing' : ''}`}>
                {editingField === field.id ? (
                  // EDIT MODE
                  <div className="edit-form">
                    <input
                      type="number"
                      name="pricePerHour"
                      value={editFormData.pricePerHour}
                      onChange={handleEditFormChange}
                      placeholder="Giá (ETH/giờ)"
                      step="0.01"
                    />
                    <div className="form-actions">
                      <button className="save-btn" onClick={handleUpdateField}>💾 Lưu</button>
                      <button className="cancel-btn" onClick={() => setEditingField(null)}>❌ Hủy</button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="field-view">
                    <div className="field-info">
                      <h3>🏟️ {field.name}</h3>
                      <p className="price">💵 {field.pricePerHour} ETH/giờ</p>
                      
                      <div className="field-stats">
                        <div className="stat-item">
                          <span className="stat-label">📅 Số lần đặt</span>
                          <span className="stat-value">{field.bookingCount || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">💰 Doanh thu</span>
                          <span className="stat-value">{field.revenue || '0'} ETH</span>
                        </div>
                        <div className="stat-item">
                          <span className={`stat-status ${field.isActive ? 'active' : 'inactive'}`}>
                            {field.isActive ? '✅ Hoạt động' : '🚫 Tắt'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="field-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditField(field)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className={`toggle-btn ${field.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleStatus(field.id)}
                      >
                        {field.isActive ? '🚫 Tắt' : '✅ Bật'}
                      </button>
                      <button 
                        className="view-bookings-btn"
                        onClick={() => handleSelectField(field)}
                      >
                        📅 Xem đặt sân
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== FIELD BOOKINGS ===== */}
      {selectedField && (
        <div className="field-bookings">
          <h2>📅 Đặt sân của {selectedField.name}</h2>
          <button 
            className="close-btn"
            onClick={() => setSelectedField(null)}
          >
            ✕ Đóng
          </button>

          {fieldBookings.length === 0 ? (
            <div className="no-data">Chưa có đặt sân nào</div>
          ) : (
            <div className="bookings-table">
              {fieldBookings.map(booking => (
                <div key={booking.id} className="booking-row">
                  <div className="booking-info">
                    <h4>Đặt sân #{booking.id}</h4>
                    <p>👤 {booking.user.substring(0, 6)}...{booking.user.substring(38)}</p>
                    <p>💰 {booking.amountPaid} ETH</p>
                    <p>📅 {new Date(booking.startTime * 1000).toLocaleString('vi-VN')} - {new Date(booking.endTime * 1000).toLocaleString('vi-VN')}</p>
                    <p>{getStatusBadge(booking.status)}</p>
                  </div>
                  <div className="booking-actions">
                    {booking.status === 0 && (
                      <button 
                        className="confirm-btn"
                        onClick={() => handleConfirmBooking(booking.id)}
                      >
                        ✓ Xác nhận
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
