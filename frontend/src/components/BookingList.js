import React, { useState, useEffect, useCallback } from 'react';
import ContractService from '../services/ContractService';
import '../styles/BookingList.css';

function BookingList({ contract, userAddress }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const bookingsData = await ContractService.getUserBookings(contract, userAddress);
      setBookings(bookingsData);
    } catch (error) {
      alert('Lỗi tải danh sách đặt sân: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [contract, userAddress]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'Chờ xác nhận', color: '#ffc107' },
      1: { text: 'Đã xác nhận', color: '#17a2b8' },
      2: { text: 'Đã huỷ', color: '#dc3545' }
    };
    const statusInfo = statusMap[status] || { text: 'Không xác định', color: '#999' };
    return <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>{statusInfo.text}</span>;
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Bạn chắc chắn muốn hủy đặt sân này?')) {
      try {
        await ContractService.cancelBooking(contract, bookingId);
        alert('Đã hủy đặt sân! ✅');
        fetchBookings();
      } catch (error) {
        alert('Lỗi hủy đặt sân: ' + error.message);
      }
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div className="booking-list-container">
      <h2>📅 Các đặt sân của bạn ({bookings.length})</h2>

      {bookings.length === 0 ? (
        <div className="no-bookings">Bạn chưa có đặt sân nào</div>
      ) : (
        <div className="bookings-table">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3>Đặt sân #{booking.id}</h3>
                {getStatusBadge(booking.status)}
              </div>
              
              <div className="booking-details">
                <p><strong>🏟️ Sân ID:</strong> #{booking.fieldId}</p>
                <p><strong>💰 Số tiền đã thanh toán:</strong> {booking.amountPaid} ETH</p>
                <p><strong>📅 Thời gian:</strong> {new Date(booking.startTime * 1000).toLocaleString('vi-VN')} - {new Date(booking.endTime * 1000).toLocaleString('vi-VN')}</p>
              </div>

              <div className="booking-actions">
                {booking.status === 0 && (
                  <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>
                    ❌ Hủy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingList;
