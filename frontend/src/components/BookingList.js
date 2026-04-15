import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService';
import '../styles/BookingList.css';

function BookingList({ contract, userAddress }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [contract, userAddress]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await ContractService.getUserBookings(contract, userAddress);
      setBookings(bookingsData);
    } catch (error) {
      alert('Error fetching bookings: ' + error.message);
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

  const handleCancel = async (bookingId) => {
    if (window.confirm('Bạn chắc chắn muốn hủy đặt sân này?')) {
      try {
        await ContractService.cancelBooking(contract, bookingId);
        alert('Đã hủy đặt sân! ✅');
        fetchBookings();
      } catch (error) {
        alert('Error cancelling booking: ' + error.message);
      }
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await ContractService.checkIn(contract, bookingId);
      alert('Check-in thành công! ✅');
      fetchBookings();
    } catch (error) {
      alert('Error checking in: ' + error.message);
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
                <p><strong>💰 Giá:</strong> {booking.totalPrice} ETH</p>
                <p><strong>📅 Thời gian:</strong> {new Date(booking.startTime * 1000).toLocaleString('vi-VN')} - {new Date(booking.endTime * 1000).toLocaleString('vi-VN')}</p>
              </div>

              <div className="booking-actions">
                {booking.status === 0 && (
                  <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>
                    ❌ Hủy
                  </button>
                )}
                {booking.status === 1 && new Date(booking.startTime * 1000) <= new Date() && (
                  <button className="checkin-btn" onClick={() => handleCheckIn(booking.id)}>
                    ✓ Check-in
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
