import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService';
import '../styles/OwnerDashboard.css';

function OwnerDashboard({ contract, userAddress }) {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldBookings, setFieldBookings] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    description: '',
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
      
      const fieldsData = await ContractService.getOwnerFields(contract, userAddress);
      console.log('[OwnerDashboard] Fields loaded:', fieldsData.length);
      setFields(fieldsData);
      
      const earningsData = await ContractService.getOwnerEarnings(contract, userAddress);
      console.log('[OwnerDashboard] Earnings loaded:', earningsData);
      setEarnings(earningsData);
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
      setSelectedField(field);
      const bookings = await ContractService.getFieldBookings(contract, field.id);
      setFieldBookings(bookings);
    } catch (error) {
      alert('Error loading field bookings: ' + error.message);
    }
  };

  const handleEditField = (field) => {
    setEditingField(field.id);
    setEditFormData({
      name: field.name,
      location: field.location,
      description: field.description,
      pricePerHour: field.pricePerHour
    });
  };

  const handleUpdateField = async () => {
    if (!editFormData.name || !editFormData.location || !editFormData.description || !editFormData.pricePerHour) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await ContractService.updateField(
        contract,
        editingField,
        editFormData.name,
        editFormData.location,
        editFormData.description,
        editFormData.pricePerHour
      );
      alert('Cập nhật sân thành công! ✅');
      setEditingField(null);
      loadOwnerData();
    } catch (error) {
      alert('Error updating field: ' + error.message);
    }
  };

  const handleToggleStatus = async (fieldId) => {
    try {
      await ContractService.toggleFieldStatus(contract, fieldId);
      alert('Cập nhật trạng thái sân thành công! ✅');
      loadOwnerData();
    } catch (error) {
      alert('Error toggling field status: ' + error.message);
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
        alert('Error confirming booking: ' + error.message);
      }
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (window.confirm('Hoàn thành đặt sân này?')) {
      try {
        await ContractService.completeBooking(contract, bookingId);
        alert('Đã hoàn thành đặt sân! ✅');
        loadOwnerData();
        const bookings = await ContractService.getFieldBookings(contract, selectedField.id);
        setFieldBookings(bookings);
      } catch (error) {
        alert('Error completing booking: ' + error.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'Chờ xác nhận', color: '#ffc107' },
      1: { text: 'Đã xác nhận', color: '#17a2b8' },
      2: { text: 'Đã check-in', color: '#28a745' },
      3: { text: 'Hoàn thành', color: '#6c757d' },
      4: { text: 'Đã huỷ', color: '#dc3545' },
      5: { text: 'Đã hoàn tiền', color: '#e83e8c' }
    };
    const statusInfo = statusMap[status] || { text: 'Không xác định', color: '#999' };
    return <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>{statusInfo.text}</span>;
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div className="owner-dashboard-container">
      {/* ===== OWNER EARNINGS ===== */}
      <div className="earnings-card">
        <div className="earnings-info">
          <h3>💰 Doanh thu của bạn</h3>
          <p className="earnings-amount">{earnings} ETH</p>
        </div>
        <button 
          className="withdraw-btn"
          onClick={() => {
            if (window.confirm(`Rút ${earnings} ETH?`)) {
              ContractService.withdraw(contract)
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
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                      placeholder="Tên sân"
                    />
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditFormChange}
                      placeholder="Địa điểm"
                    />
                    <textarea
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditFormChange}
                      placeholder="Mô tả"
                      rows="3"
                    />
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
                      <p className="location">📍 {field.location}</p>
                      <p className="description">{field.description}</p>
                      <p className="price">💵 {field.pricePerHour} ETH/giờ</p>
                      <span className={`status-label ${field.isActive ? 'active' : 'inactive'}`}>
                        {field.isActive ? '✅ Hoạt động' : '🚫 Tắt'}
                      </span>
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
                    <p>💰 {booking.totalPrice} ETH</p>
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
                    {booking.status === 2 && new Date(booking.endTime * 1000) <= new Date() && (
                      <button 
                        className="complete-btn"
                        onClick={() => handleCompleteBooking(booking.id)}
                      >
                        ✅ Hoàn thành
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
