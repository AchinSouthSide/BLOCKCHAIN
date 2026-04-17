import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService';
import '../styles/BookingManagement.css';

function BookingManagement({ contract, userAddress }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

  useEffect(() => {
    if (contract && userAddress) {
      loadBookings();
    }
  }, [contract, userAddress]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await ContractService.getUserBookings(contract, userAddress);
      setBookings(bookingsData);
    } catch (error) {
      alert('Error loading bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'pending') return booking.status === 0;
    if (filter === 'confirmed') return booking.status === 1;
    if (filter === 'completed') return booking.status === 3;
    return true;
  });

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

  const handleCheckIn = async (bookingId) => {
    try {
      await ContractService.checkIn(contract, bookingId);
      alert('Check-in thành công! ✅');
      loadBookings();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (window.confirm('Hoàn thành đặt sân này?')) {
      try {
        await ContractService.completeBooking(contract, bookingId);
        alert('Đã hoàn thành đặt sân! ✅');
        loadBookings();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const handleRefundBooking = async (bookingId) => {
    if (window.confirm('Yêu cầu hoàn tiền?')) {
      try {
        await ContractService.refundBooking(contract, bookingId);
        alert('Đã yêu cầu hoàn tiền! ✅');
        loadBookings();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Hủy đặt sân này?')) {
      try {
        await ContractService.cancelBooking(contract, bookingId);
        alert('Đã hủy đặt sân! ✅');
        loadBookings();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div className="booking-management-container">
      <div className="booking-header">
        <h2>📅 Quản lý đặt sân</h2>
        
        {/* ===== FILTER BUTTONS ===== */}
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({bookings.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Chờ xác nhận ({bookings.filter(b => b.status === 0).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Đã xác nhận ({bookings.filter(b => b.status === 1).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Hoàn thành ({bookings.filter(b => b.status === 3).length})
          </button>
        </div>
      </div>

      {/* ===== BOOKINGS LIST ===== */}
      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          {filter === 'all' ? 'Chưa có đặt sân nào' : `Không có đặt sân ${filter}`}
        </div>
      ) : (
        <div className="bookings-container">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              {/* ===== BOOKING STATUS & ID ===== */}
              <div className="booking-header">
                <div className="booking-id">
                  <h3>Đặt sân #{booking.id}</h3>
                  <p className="field-id">Sân #{booking.fieldId}</p>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              {/* ===== BOOKING DETAILS ===== */}
              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">💰 Giá tiền:</span>
                  <span className="value">{booking.totalPrice} ETH</span>
                </div>
                <div className="detail-row">
                  <span className="label">📅 Thời gian:</span>
                  <span className="value">
                    {new Date(booking.startTime * 1000).toLocaleString('vi-VN')}
                    <br />
                    →
                    <br />
                    {new Date(booking.endTime * 1000).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">⏱️ Thời lượng:</span>
                  <span className="value">{((booking.endTime - booking.startTime) / 3600).toFixed(1)} giờ</span>
                </div>
              </div>

              {/* ===== BOOKING ACTIONS ===== */}
              <div className="booking-actions">
                {/* Status: Pending (0) */}
                {booking.status === 0 && (
                  <>
                    <button 
                      className="refund-btn"
                      onClick={() => handleRefundBooking(booking.id)}
                      title="Hoàn return tiền"
                    >
                      💸 Hoàn tiền
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking.id)}
                      title="Hủy booking"
                    >
                      ❌ Hủy
                    </button>
                  </>
                )}

                {/* Status: Confirmed (1) */}
                {booking.status === 1 && new Date(booking.startTime * 1000) <= new Date() && (
                  <button 
                    className="checkin-btn"
                    onClick={() => handleCheckIn(booking.id)}
                    title="Check-in"
                  >
                    ✓ Check-in
                  </button>
                )}

                {booking.status === 1 && new Date(booking.startTime * 1000) > new Date() && (
                  <button 
                    className="refund-btn"
                    onClick={() => handleRefundBooking(booking.id)}
                    disabled
                  >
                    ⏰ Chờ thời gian check-in
                  </button>
                )}

                {/* Status: Checked-in (2) */}
                {booking.status === 2 && new Date(booking.endTime * 1000) <= new Date() && (
                  <button 
                    className="complete-btn"
                    onClick={() => handleCompleteBooking(booking.id)}
                    title="Hoàn thành booking"
                  >
                    ✅ Hoàn thành
                  </button>
                )}

                {booking.status === 2 && new Date(booking.endTime * 1000) > new Date() && (
                  <button 
                    className="complete-btn"
                    disabled
                    title="Chờ đến thời gian kết thúc"
                  >
                    ⏰ Đang sử dụng
                  </button>
                )}

                {/* Status: Completed (3) - No actions */}
                {booking.status === 3 && (
                  <div className="status-info">✅ Hoàn thành</div>
                )}

                {/* Status: Cancelled (4) - No actions */}
                {booking.status === 4 && (
                  <div className="status-info">❌ Đã hủy</div>
                )}

                {/* Status: Refunded (5) - No actions */}
                {booking.status === 5 && (
                  <div className="status-info">💸 Đã hoàn tiền</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingManagement;
