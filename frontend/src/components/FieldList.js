/* global BigInt */
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import ContractService from '../services/ContractService';
import '../styles/FieldList.css';

function FieldList({ contract }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingData, setBookingData] = useState({
    startHour: '09',
    endHour: '11'
  });

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[FieldList] Fetching fields for date:', selectedDate);
      const fieldsData = await ContractService.getAllFields(contract);
      console.log('[FieldList] Fields loaded:', fieldsData.length);
      setFields(fieldsData);
    } catch (error) {
      console.error('[FieldList] Error fetching fields:', error);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [contract, selectedDate]);

  useEffect(() => {
    fetchFields();
    // Auto-refresh khi ngày thay đổi
  }, [fetchFields]);

  const handleDateChange = (field, value) => {
    setBookingData({ ...bookingData, [field]: value });
  };

  const handleBooking = async () => {
    if (!selectedField || !bookingData.startHour || !bookingData.endHour) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      // Sử dụng ngày đã chọn
      const startDateTime = new Date(`${selectedDate}T${bookingData.startHour}:00:00`);
      const endDateTime = new Date(`${selectedDate}T${bookingData.endHour}:00:00`);

      if (endDateTime <= startDateTime) {
        alert('Giờ kết thúc phải sau giờ bắt đầu');
        return;
      }

      const startTs = Math.floor(startDateTime.getTime() / 1000);
      const endTs = Math.floor(endDateTime.getTime() / 1000);
      const nowTs = Math.floor(Date.now() / 1000);
      if (startTs < nowTs) {
        alert('Giờ bắt đầu phải ở tương lai');
        return;
      }

      // (Optional) pre-check conflict to avoid paying gas for revert
      const hasConflict = await ContractService.hasTimeConflict(
        contract,
        selectedField.id,
        startTs,
        endTs
      );
      if (hasConflict) {
        alert('Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.');
        return;
      }

      // Calculate value to send in Wei: pricePerHourWei * ceil(durationHours)
      const durationSeconds = endTs - startTs;
      const durationHoursCeil = Math.ceil(durationSeconds / 3600);
      const pricePerHourWei = BigInt(selectedField.pricePerHourWei);
      const valueWei = pricePerHourWei * BigInt(durationHoursCeil);

      await ContractService.bookField(
        contract,
        selectedField.id,
        startTs,
        endTs,
        valueWei
      );

      const paidEth = ethers.formatEther(valueWei);
      alert(
        `Đặt sân thành công ✅\n` +
        `Bạn đã thanh toán: ${paidEth} ETH (chưa tính phí gas).\n` +
        `Trạng thái: Chờ admin xác nhận.`
      );
      setSelectedField(null);
      fetchFields();
    } catch (error) {
      alert('Lỗi đặt sân: ' + error.message);
    }
  };

  if (loading) return <div className="loading">⏳ Đang tải...</div>;

  // Tính ngày hôm nay
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="field-list-container">
      {/* ===== DATE PICKER ===== */}
      <div className="date-picker-section">
        <label htmlFor="selectedDate">📅 Chọn ngày đặt sân:</label>
        <input 
          type="date" 
          id="selectedDate"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
        />
        <span className="date-display">
          📆 {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="fields-grid">
        {fields.length === 0 ? (
          <div className="no-fields">Chưa có sân nào</div>
        ) : (
          fields.map(field => (
            <div key={field.id} className="field-card">
              <div className="field-header">
                <h3>🏟️ {field.name}</h3>
                <span className="price">{field.pricePerHour} ETH/giờ</span>
              </div>
              <button 
                className="book-btn"
                onClick={() => setSelectedField(field)}
                disabled={!field.isActive}
              >
                {field.isActive ? 'Đặt sân →' : 'Tạm đóng'}
              </button>
            </div>
          ))
        )}
      </div>

      {selectedField && (
        <div className="booking-modal-overlay" onClick={() => setSelectedField(null)}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <h2>Đặt sân: {selectedField.name}</h2>
            <div className="booking-form">
              <div className="form-group">
                <label>Giờ bắt đầu</label>
                <input 
                  type="time" 
                  value={bookingData.startHour + ':00'}
                  onChange={(e) => handleDateChange('startHour', e.target.value.split(':')[0])}
                />
              </div>

              <div className="form-group">
                <label>Giờ kết thúc</label>
                <input 
                  type="time" 
                  value={bookingData.endHour + ':00'}
                  onChange={(e) => handleDateChange('endHour', e.target.value.split(':')[0])}
                />
              </div>

              <button className="confirm-btn" onClick={handleBooking}>
                Xác nhận đặt sân
              </button>
              <button className="cancel-btn" onClick={() => setSelectedField(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldList;
