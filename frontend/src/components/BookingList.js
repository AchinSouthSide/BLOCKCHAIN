import React, { useState, useEffect, useCallback } from 'react';
import ContractService from '../services/ContractService';
import '../styles/BookingList.css';

function BookingList({ contract, userAddress }) {
  const [bookings, setBookings] = useState([]);
  const [fieldNameById, setFieldNameById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelSubmittingId, setCancelSubmittingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const bookingsData = await ContractService.getUserBookings(contract, userAddress);
      setBookings(bookingsData);
    } catch (error) {
      const errorMsg = 'Lỗi tải danh sách đặt sân: ' + (error?.message || error);
      console.error('[BookingList]', errorMsg);
      setError(errorMsg);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [contract, userAddress]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    let mounted = true;
    const loadFields = async () => {
      try {
        if (!contract) return;
        const fields = await ContractService.getAllFields(contract);
        const nextMap = {};
        for (const f of fields || []) {
          nextMap[Number(f.id)] = f.name;
        }
        if (mounted) setFieldNameById(nextMap);
      } catch (e) {
        // ignore; fallback to showing ID
      }
    };
    loadFields();
    return () => {
      mounted = false;
    };
  }, [contract]);

  const getFieldLabel = (fieldId) => {
    const name = fieldNameById?.[Number(fieldId)];
    if (name && String(name).trim()) return `#${fieldId} - ${name}`;
    return `#${fieldId}`;
  };

  const getStatusBadge = (status) => {
    if (status === 0) return <span className="status-badge pending">⏳ Chờ xác nhận</span>;
    if (status === 1) return <span className="status-badge confirmed">✅ Đã xác nhận</span>;
    if (status === 2) return <span className="status-badge cancelled">❌ Đã huỷ</span>;
    return <span className="status-badge unknown">❔ Không xác định</span>;
  };

  const handleCancel = async (bookingId) => {
    if (cancelSubmittingId) return;
    if (window.confirm('Bạn chắc chắn muốn hủy đặt sân này?')) {
      try {
        setCancelSubmittingId(bookingId);
        await ContractService.cancelBooking(contract, bookingId);
        alert('Đã hủy đặt sân! ✅');
        await fetchBookings();
      } catch (error) {
        alert('Lỗi hủy đặt sân: ' + error.message);
      } finally {
        setCancelSubmittingId(null);
      }
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  return (
    <div className="booking-list-container">
      <h2>📅 Các đặt sân của bạn ({bookings.length})</h2>

      {error && (
        <div style={{ background: '#ffe0e0', border: '2px solid #ff6b6b', color: '#dc3545', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

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
                <p><strong>🏟️ Sân:</strong> {getFieldLabel(booking.fieldId)}</p>
                <p><strong>💰 Số tiền đã thanh toán:</strong> {booking.amountPaid} ETH</p>
                <p><strong>📅 Thời gian:</strong> {new Date(booking.startTime * 1000).toLocaleString('vi-VN')} - {new Date(booking.endTime * 1000).toLocaleString('vi-VN')}</p>
              </div>

              <div className="booking-actions">
                {booking.status === 0 && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelSubmittingId === booking.id}
                  >
                    {cancelSubmittingId === booking.id ? '⏳ Đang hủy...' : '❌ Hủy'}
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
