import React, { useState } from 'react';
import ContractService from '../services/ContractService';
import '../styles/CreateField.css';

function CreateField({ contract, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    pricePerHour: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.description || !formData.pricePerHour) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      await ContractService.createField(
        contract,
        formData.name,
        formData.location,
        formData.description,
        formData.pricePerHour
      );
      alert('Tạo sân thành công! ✅');
      setFormData({
        name: '',
        location: '',
        description: '',
        pricePerHour: ''
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      alert('Error creating field: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-field-container">
      <form className="create-field-form" onSubmit={handleSubmit}>
        <h2>➕ Tạo sân mới</h2>

        <div className="form-group">
          <label htmlFor="name">Tên sân *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="VD: Sân bóng đá A"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Địa điểm *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="VD: 123 Đường ABC, TP HCM"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="VD: Sân bóng 5 người, có mái che..."
            disabled={loading}
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pricePerHour">Giá (ETH/giờ) *</label>
          <input
            type="number"
            id="pricePerHour"
            name="pricePerHour"
            value={formData.pricePerHour}
            onChange={handleChange}
            placeholder="VD: 0.1"
            step="0.01"
            disabled={loading}
          />
        </div>

        <button 
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? '⏳ Đang tạo...' : '✓ Tạo sân'}
        </button>
      </form>
    </div>
  );
}

export default CreateField;
