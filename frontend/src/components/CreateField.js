import React, { useState } from 'react';
import { ethers } from 'ethers';
import ContractService from '../services/ContractService';
import '../styles/CreateField.css';

function CreateField({ contract, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    pricePerHour: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.pricePerHour) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const priceWei = ethers.parseEther(String(formData.pricePerHour));
      await ContractService.createField(
        contract,
        formData.name,
        priceWei
      );
      alert('Tạo sân thành công! ✅');
      setFormData({
        name: '',
        pricePerHour: ''
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      alert('Lỗi tạo sân: ' + error.message);
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
