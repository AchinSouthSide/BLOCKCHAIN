import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService';
import '../styles/FieldDetails.css';

function FieldDetails({ contract, fieldId, onClose }) {
  const [field, setField] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contract && fieldId) {
      loadFieldData();
    }
  }, [contract, fieldId]);

  const loadFieldData = async () => {
    try {
      setLoading(true);
      // Fetch field details
      const fieldData = await contract.getField(fieldId);
      setField({
        ...fieldData,
        id: Number(fieldData.id),
        pricePerHour: fieldData.pricePerHour.toString()
      });

      // Fetch field bookings
      const bookingsData = await ContractService.getFieldBookings(contract, fieldId);
      setBookings(bookingsData);
    } catch (error) {
      alert('Error loading field details: ' + error.message);
    } finally {
      setLoading(false);
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
  if (!field) return <div>Không tìm thấy sân</div>;

  return (
    <div className="field-details-container">
      <div className="field-details-header">
        <button className="close-btn" onClick={onClose}>← Quay lại</button>
        <h1>🏟️ {field.name}</h1>
      </div>

      {/* ===== FIELD INFORMATION ===== */}
      <div className="field-info-section">
        <div className="info-card">
          <h3>ℹ️ Thông tin sân</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>📍 Địa điểm</label>
              <p>{field.location}</p>
            </div>
            <div className="info-item">
              <label>💵 Giá</label>
              <p>{field.pricePerHour} wei/giờ</p>
            </div>
            <div className="info-item">
              <label>👤 Chủ sân</label>
              <p>{field.owner.substring(0, 6)}...{field.owner.substring(38)}</p>
            </div>
            <div className="info-item">
              <label>⚙️ Trạng thái</label>
              <p className={field.isActive ? 'active' : 'inactive'}>
                {field.isActive ? '✅ Hoạt động' : '🚫 Tắt'}
              </p>
            </div>
          </div>
          <div className="info-item full">
            <label>📝 Mô tả</label>
            <p>{field.description}</p>
          </div>
        </div>
      </div>

      {/* ===== BOOKINGS STATISTICS ===== */}
      <div className="booking-stats">
        <div className="stat-card">
          <span className="stat-label">Tổng đặt sân</span>
          <span className="stat-value">{bookings.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đã xác nhận</span>
          <span className="stat-value">{bookings.filter(b => [1, 2, 3].includes(b.status)).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hoàn thành</span>
          <span className="stat-value">{bookings.filter(b => b.status === 3).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đang chờ</span>
          <span className="stat-value">{bookings.filter(b => b.status === 0).length}</span>
        </div>
      </div>

      {/* ===== BOOKINGS LIST ===== */}
      <div className="bookings-section">
        <h3>📅 Danh sách đặt sân ({bookings.length})</h3>
        
        {bookings.length === 0 ? (
          <div className="no-bookings">Chưa có đặt sân nào</div>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h4>Đặt sân #{booking.id}</h4>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="booking-body">
                  <p><strong>👤 Người dùng:</strong> {booking.user.substring(0, 6)}...{booking.user.substring(38)}</p>
                  <p><strong>💰 Giá:</strong> {booking.totalPrice} ETH</p>
                  <p><strong>📅 Bắt đầu:</strong> {new Date(booking.startTime * 1000).toLocaleString('vi-VN')}</p>
                  <p><strong>📅 Kết thúc:</strong> {new Date(booking.endTime * 1000).toLocaleString('vi-VN')}</p>
                  <p><strong>⏱️ Thời lượng:</strong> {((booking.endTime - booking.startTime) / 3600).toFixed(1)} giờ</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldDetails;
