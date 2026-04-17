import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import ContractService from '../services/ContractService.js';
import '../styles/AdminPanel.css';

/**
 * Admin Panel Component
 * Comprehensive admin-only interface for managing fields, statistics, and withdrawals
 * ALL FUNCTIONS ARE ADMIN-ONLY (verified in smart contract)
 */
function AdminPanel({ contract, provider, address }) {
  // ==================== STATE MANAGEMENT ====================
  
  const [activeTab, setActiveTab] = useState('overview');
  const [adminSummary, setAdminSummary] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [fieldsWithStats, setFieldsWithStats] = useState([]);
  const [topFields, setTopFields] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state for creating fields
  const [newFieldForm, setNewFieldForm] = useState({
    name: '',
    pricePerHour: '',
  });

  // Form state for updating field price
  const [updatePriceForm, setUpdatePriceForm] = useState({
    fieldId: '',
    newPrice: '',
  });

  const [priceDraftByFieldId, setPriceDraftByFieldId] = useState({});

  // ==================== ADMIN VERIFICATION ====================

  /**
   * Verify current user is admin (platformOwner OR delegated admin)
   */
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        if (contract && address) {
          let isAdminUser = false;

          if (typeof contract.isAdmin === 'function') {
            try {
              isAdminUser = await contract.isAdmin(address);
            } catch (e) {
              const platformOwner = await contract.platformOwner();
              isAdminUser = address.toLowerCase() === platformOwner.toLowerCase();
            }
          } else if (typeof contract.admins === 'function') {
            try {
              isAdminUser = await contract.admins(address);
            } catch (e) {
              const platformOwner = await contract.platformOwner();
              isAdminUser = address.toLowerCase() === platformOwner.toLowerCase();
            }
          } else {
            const platformOwner = await contract.platformOwner();
            isAdminUser = address.toLowerCase() === platformOwner.toLowerCase();
          }

          setIsAdmin(isAdminUser);
          
          if (!isAdminUser) {
            setError('❌ Bạn không có quyền Admin. Chỉ platformOwner hoặc ví được cấp quyền Admin mới truy cập được.');
          }
        }
      } catch (err) {
        console.error('Admin verification error:', err);
      }
    };

    verifyAdmin();
  }, [contract, address]);

  // ==================== DATA LOADING ====================

  const getContractAddress = useCallback(async () => {
    if (!contract) return null;
    // ethers v6: Contract has `.target` and `getAddress()`; `.address` is not reliable.
    if (contract.target) return contract.target;
    if (typeof contract.getAddress === 'function') return await contract.getAddress();
    return null;
  }, [contract]);

  /**
   * Load admin dashboard summary
   */
  const loadAdminSummary = useCallback(async () => {
    if (!contract || !isAdmin) return;
    
    try {
      setLoading(true);
      const summary = await ContractService.getAdminSummary(contract);
      setAdminSummary(summary);
      setError(null);
    } catch (err) {
      console.error('Error loading admin summary:', err);
      setError('Lỗi tải dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [contract, isAdmin]);

  /**
   * Load all fields
   */
  /**
   * Load fields with admin stats (confirmed bookings + revenue)
   */
  const loadFieldsWithStats = useCallback(async () => {
    if (!contract || !isAdmin) return;

    try {
      setLoading(true);
      const fields = await ContractService.getAllFields(contract);
      const validFields = fields.filter(f => f && Number(f.id) !== 0);

      const stats = await Promise.all(
        validFields.map(async (field) => {
          try {
            const [fieldStats, bookings] = await Promise.all([
              ContractService.getFieldStats(contract, field.id),
              ContractService.getFieldBookings(contract, field.id),
            ]);

            const totalBookingsAll = bookings.length;
            const totalBookingsNonCancelled = bookings.filter(b => b.status !== 2).length;
            const pendingCount = bookings.filter(b => b.status === 0).length;

            return {
              ...field,
              totalBookingsAll,
              totalBookingsNonCancelled,
              pendingCount,
              totalBookingsConfirmed: fieldStats.totalBookings,
              totalRevenueConfirmed: fieldStats.totalRevenue,
              totalRevenueConfirmedWei: fieldStats.totalRevenueWei,
            };
          } catch (e) {
            return {
              ...field,
              totalBookingsAll: 0,
              totalBookingsNonCancelled: 0,
              pendingCount: 0,
              totalBookingsConfirmed: 0,
              totalRevenueConfirmed: '0',
              totalRevenueConfirmedWei: '0',
            };
          }
        })
      );

      setAllFields(validFields);
      setFieldsWithStats(stats);

      // Initialize draft prices (ETH) for quick edit
      setPriceDraftByFieldId((prev) => {
        const next = { ...prev };
        for (const f of stats) {
          if (next[f.id] === undefined || next[f.id] === null) {
            next[f.id] = f.pricePerHour;
          }
        }
        return next;
      });
      setError(null);
    } catch (err) {
      console.error('Error loading fields with stats:', err);
      setError('Lỗi tải thống kê sân: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [contract, isAdmin]);

  /**
   * Load top revenue fields
   */
  const loadTopFields = useCallback(async () => {
    if (!contract || !isAdmin) return;
    
    try {
      setLoading(true);
      const topFieldsList = await ContractService.getTopFields(contract, 5);
      setTopFields(topFieldsList);
      setError(null);
    } catch (err) {
      console.error('Error loading top fields:', err);
      setError('Lỗi tải top fields: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [contract, isAdmin]);

  /**
   * Load bookings across all fields (admin view)
   */
  const loadAllBookings = useCallback(async () => {
    if (!contract || !isAdmin) return;

    try {
      setLoading(true);
      const fields = await ContractService.getAllFields(contract);
      const validFields = fields.filter(f => f && Number(f.id) !== 0);

      const bookingsByField = await Promise.all(
        validFields.map(async (field) => {
          try {
            const bookings = await ContractService.getFieldBookings(contract, field.id);
            return bookings.map(b => ({
              ...b,
              fieldName: field.name,
              fieldPricePerHour: field.pricePerHour,
            }));
          } catch (e) {
            return [];
          }
        })
      );

      const merged = bookingsByField.flat().sort((a, b) => b.createdAt - a.createdAt);
      setAllBookings(merged);
      setPendingBookings(merged.filter(b => b.status === 0));
      setError(null);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Lỗi tải bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [contract, isAdmin]);

  // ==================== EFFECT HOOKS ====================

  /**
   * Load initial data
   */
  useEffect(() => {
    if (!contract || !isAdmin) return;

    if (activeTab === 'overview') {
      loadAdminSummary();
      loadTopFields();
    } else if (activeTab === 'fields') {
      loadFieldsWithStats();
    } else if (activeTab === 'bookings') {
      loadAllBookings();
      loadAdminSummary();
    }
  }, [activeTab, contract, isAdmin, loadAdminSummary, loadTopFields, loadFieldsWithStats, loadAllBookings]);

  /**
   * Setup event listeners for admin notifications
   */
  useEffect(() => {
    if (!provider || !contract || !isAdmin) return;

    try {
      let cleanup = null;

      (async () => {
        const contractAddress = await getContractAddress();
        if (!contractAddress) return;

        const listeners = ContractService.setupAdminEventListeners(
          provider,
          contractAddress,
        (event) => {
          const notification = `💰 Thanh toán: Sân #${event.fieldId} - ${event.amount} ETH (Admin nhận: ${event.adminEarnings} ETH)`;
          setAdminNotifications(prev => [...prev, notification].slice(-5));
          // Keep stats fresh
          loadAdminSummary();
          if (activeTab === 'fields') loadFieldsWithStats();
          if (activeTab === 'bookings') loadAllBookings();
        },
        (event) => {
          const notification = `💸 Rút tiền: ${event.amount} ETH`;
          setAdminNotifications(prev => [...prev, notification].slice(-5));
          loadAdminSummary();
        },
        (event) => {
          const userShort = event.user ? `${event.user.slice(0, 6)}...${event.user.slice(-4)}` : 'unknown';
          const notification = `📥 Đơn mới #${event.bookingId}: Sân #${event.fieldId} - ${event.amount} ETH (đã vào contract, chờ xác nhận) - User ${userShort}`;
          setAdminNotifications(prev => [...prev, notification].slice(-5));

          // Refresh bookings list when admin is watching it
          if (activeTab === 'bookings') {
            loadAllBookings();
            loadAdminSummary();
          }
        }
        );

        cleanup = () => listeners.removeAllListeners();
      })();

      return () => {
        if (cleanup) cleanup();
      };
    } catch (err) {
      console.error('Error setting up event listeners:', err);
    }
  }, [provider, contract, isAdmin, getContractAddress, loadAdminSummary, loadFieldsWithStats, loadAllBookings, activeTab]);

  // ==================== ADMIN ACTIONS ====================

  /**
   * Create new field
   */
  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!contract || !newFieldForm.name || !newFieldForm.pricePerHour) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const priceInWei = ethers.parseEther(newFieldForm.pricePerHour);
      await ContractService.createField(contract, newFieldForm.name, priceInWei);
      
      const notification = `✅ Sân "${newFieldForm.name}" đã được tạo thành công`;
      setAdminNotifications(prev => [...prev, notification]);
      setNewFieldForm({ name: '', pricePerHour: '' });
      
      // Reload fields
      await loadFieldsWithStats();
      await loadAdminSummary();
      setError(null);
    } catch (err) {
      console.error('Error creating field:', err);
      setError('Lỗi tạo sân: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update field price
   */
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!contract || !updatePriceForm.fieldId || !updatePriceForm.newPrice) {
      setError('Vui lòng chọn field và nhập giá mới');
      return;
    }

    try {
      setLoading(true);
      const priceInWei = ethers.parseEther(updatePriceForm.newPrice);
      await ContractService.updateFieldPrice(contract, updatePriceForm.fieldId, priceInWei);
      
      const notification = `✏️ Cập nhật giá sân #${updatePriceForm.fieldId}: ${updatePriceForm.newPrice} ETH/giờ`;
      setAdminNotifications(prev => [...prev, notification]);
      setUpdatePriceForm({ fieldId: '', newPrice: '' });
      
      // Reload fields
      await loadFieldsWithStats();
      setError(null);
    } catch (err) {
      console.error('Error updating price:', err);
      setError('Lỗi cập nhật giá: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdatePrice = async (fieldId) => {
    const draft = priceDraftByFieldId[fieldId];
    if (!draft || Number(draft) <= 0) {
      setError('Giá mới không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const priceInWei = ethers.parseEther(String(draft));
      await ContractService.updateFieldPrice(contract, fieldId, priceInWei);

      setAdminNotifications(prev => [...prev, `✏️ Cập nhật giá sân #${fieldId}: ${draft} ETH/giờ`].slice(-5));
      await loadFieldsWithStats();
      setError(null);
    } catch (err) {
      console.error('Error quick updating price:', err);
      setError('Lỗi cập nhật giá: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle field status (active/inactive)
   */
  const handleToggleFieldStatus = async (fieldId) => {
    if (!contract) return;

    try {
      setLoading(true);
      await ContractService.toggleFieldStatus(contract, fieldId);
      
      const current = allFields.find(f => Number(f.id) === Number(fieldId));
      const status = current?.isActive ? 'đã tắt' : 'đã bật';
      const notification = `🔄 Sân #${fieldId} ${status}`;
      setAdminNotifications(prev => [...prev, notification]);
      
      // Reload fields
      await loadFieldsWithStats();
      await loadAdminSummary();
      setError(null);
    } catch (err) {
      console.error('Error toggling field status:', err);
      setError('Lỗi thay đổi trạng thái: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // "Xóa" theo hướng an toàn: disable field (không xóa record on-chain để không ảnh hưởng booking history)
  const handleDeleteFieldSafe = async (fieldId) => {
    const current = allFields.find(f => Number(f.id) === Number(fieldId));
    if (!current) return;
    if (!window.confirm(`Xóa sân #${fieldId} (${current.name})? (Thực chất là TẮT sân để không ảnh hưởng booking)`)) {
      return;
    }

    try {
      setLoading(true);
      // If active -> toggle to inactive. If already inactive, do nothing.
      if (current.isActive) {
        await ContractService.toggleFieldStatus(contract, fieldId);
      }
      setAdminNotifications(prev => [...prev, `🗑️ Đã tắt (xóa) field #${fieldId}`].slice(-5));
      await loadFieldsWithStats();
      await loadAdminSummary();
      setError(null);
    } catch (err) {
      console.error('Error disabling field:', err);
      setError('Lỗi xóa/tắt sân: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    if (!contract) return;
    try {
      setLoading(true);
      const receipt = await ContractService.confirmBooking(contract, bookingId);

      // Try to parse BookingPaymentReceived event to show admin earnings
      let paymentInfo = null;
      if (receipt?.logs && contract?.interface?.parseLog) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'BookingPaymentReceived') {
              paymentInfo = parsed;
              break;
            }
          } catch (e) {
            // ignore non-matching logs
          }
        }
      }

      if (paymentInfo?.args) {
        const totalWei = paymentInfo.args.amount;
        const adminWei = paymentInfo.args.adminEarnings;
        const feeWei = totalWei - adminWei;

        const totalEth = ethers.formatEther(totalWei);
        const adminEth = ethers.formatEther(adminWei);
        const feeEth = ethers.formatEther(feeWei);

        setAdminNotifications(prev => [
          ...prev,
          `💰 Đã nhận thanh toán cho booking #${bookingId}: +${adminEth} ETH (tổng ${totalEth} ETH, phí nền tảng ${feeEth} ETH)`
        ].slice(-5));
      } else {
        setAdminNotifications(prev => [...prev, `✅ Đã xác nhận đặt sân #${bookingId}`].slice(-5));
      }

      await loadAllBookings();
      await loadAdminSummary();
      await loadFieldsWithStats();
      setError(null);
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError('Lỗi confirm booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!contract) return;
    try {
      setLoading(true);
      await ContractService.cancelBooking(contract, bookingId);
      setAdminNotifications(prev => [...prev, `❌ Đã huỷ đặt sân #${bookingId}`].slice(-5));
      await loadAllBookings();
      await loadAdminSummary();
      setError(null);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Lỗi cancel booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Withdraw admin balance
   */
  const handleWithdraw = async () => {
    if (!contract || !adminSummary || parseFloat(adminSummary.adminBalance) <= 0) {
      setError('Không có ETH để rút');
      return;
    }

    if (!window.confirm(`Bạn chắc chắn muốn rút ${adminSummary.adminBalance} ETH?`)) {
      return;
    }

    try {
      setLoading(true);
      await ContractService.withdrawBalance(contract);
      
      const notification = `💸 Rút ${adminSummary.adminBalance} ETH thành công`;
      setAdminNotifications(prev => [...prev, notification]);
      
      // Reload summary
      await loadAdminSummary();
      setError(null);
    } catch (err) {
      console.error('Error withdrawing balance:', err);
      setError('Lỗi rút tiền: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UI RENDERING ====================

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="error-message">
          ❌ Bạn không có quyền truy cập khu vực Admin. Chỉ ví chủ hợp đồng (platformOwner) có thể sử dụng.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>👨‍💼 Bảng điều khiển Admin</h1>
        <p>Ví Admin (platformOwner): {address?.substring(0, 6)}...{address?.substring(38)}</p>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Notifications */}
      {adminNotifications.length > 0 && (
        <div className="notifications">
          {adminNotifications.map((notif, idx) => (
            <div key={idx} className="notification">{notif}</div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Tổng quan
        </button>
        <button
          className={`tab-button ${activeTab === 'fields' ? 'active' : ''}`}
          onClick={() => setActiveTab('fields')}
        >
          🏟️ Quản lý sân
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 Đặt sân
        </button>
        <button
          className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance')}
        >
          💰 Tài chính
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && <div className="loading">⏳ Đang tải...</div>}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && adminSummary && (
        <div className="tab-content">
          <div className="overview-grid">
            <div className="stat-card">
              <h3>Tổng số sân</h3>
              <p className="stat-value">{adminSummary.totalFields}</p>
            </div>
            <div className="stat-card">
              <h3>Tổng đặt sân (đã xác nhận)</h3>
              <p className="stat-value">{adminSummary.totalBookings}</p>
            </div>
            <div className="stat-card">
              <h3>Tổng doanh thu (tất cả thời gian)</h3>
              <p className="stat-value">{parseFloat(adminSummary.totalRevenue).toFixed(4)} ETH</p>
            </div>
            <div className="stat-card">
              <h3>Số dư có thể rút</h3>
              <p className="stat-value">{parseFloat(adminSummary.adminBalance).toFixed(4)} ETH</p>
            </div>
            <div className="stat-card">
              <h3>Tổng số dư trong contract</h3>
              <p className="stat-value">{parseFloat(adminSummary.contractTotalBalance).toFixed(4)} ETH</p>
            </div>
          </div>

          {/* Top Revenue Fields */}
          {topFields.length > 0 && (
            <div className="top-fields-section">
              <h2>🏆 Top sân doanh thu cao</h2>
              <table className="fields-table">
                <thead>
                  <tr>
                    <th>Tên sân</th>
                    <th>Giá/giờ</th>
                    <th>Số lượt đặt</th>
                    <th>Doanh thu</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {topFields.map(field => (
                    <tr key={field.fieldId}>
                      <td>{field.fieldName}</td>
                      <td>{parseFloat(field.pricePerHour).toFixed(4)} ETH</td>
                      <td>{field.totalBookings}</td>
                      <td>{parseFloat(field.totalRevenue).toFixed(4)} ETH</td>
                      <td className={field.isActive ? 'active' : 'inactive'}>
                        {field.isActive ? '🟢 Hoạt động' : '🔴 Đang tắt'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FIELD MANAGEMENT TAB */}
      {activeTab === 'fields' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>🏟️ Quản lý danh sách sân</h2>
            <div style={{ fontWeight: 600 }}>
              Doanh thu (tổng ETH từ đặt sân - confirmed):{' '}
              {adminSummary ? `${parseFloat(adminSummary.totalRevenue).toFixed(4)} ETH` : '...'}
            </div>
          </div>

          {/* Create New Field */}
          <div className="form-section">
            <h2>➕ Tạo sân mới</h2>
            <form onSubmit={handleCreateField} className="admin-form">
              <div className="form-group">
                <label>Tên sân</label>
                <input
                  type="text"
                  placeholder="VD: Sân bóng đá 5 người"
                  value={newFieldForm.name}
                  onChange={(e) => setNewFieldForm({...newFieldForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giá mỗi giờ (ETH)</label>
                <input
                  type="number"
                  placeholder="VD: 0.1"
                  step="0.01"
                  min="0"
                  value={newFieldForm.pricePerHour}
                  onChange={(e) => setNewFieldForm({...newFieldForm, pricePerHour: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                Tạo sân
              </button>
            </form>
          </div>

          {/* Update Field Price */}
          <div className="form-section">
            <h2>✏️ Cập nhật giá sân</h2>
            <form onSubmit={handleUpdatePrice} className="admin-form">
              <div className="form-group">
                <label>Chọn sân</label>
                <select
                  value={updatePriceForm.fieldId}
                  onChange={(e) => setUpdatePriceForm({...updatePriceForm, fieldId: e.target.value})}
                  required
                >
                  <option value="">Chọn sân...</option>
                  {allFields.map(field => (
                    <option key={field.id} value={field.id}>
                      #{field.id} - {field.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Giá mới mỗi giờ (ETH)</label>
                <input
                  type="number"
                  placeholder="VD: 0.15"
                  step="0.01"
                  min="0"
                  value={updatePriceForm.newPrice}
                  onChange={(e) => setUpdatePriceForm({...updatePriceForm, newPrice: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                Cập nhật giá
              </button>
            </form>
          </div>

          {/* Fields List */}
          {fieldsWithStats.length > 0 && (() => {
            const booked = fieldsWithStats.filter(f => (f.totalBookingsAll || 0) > 0);
            const unbooked = fieldsWithStats.filter(f => (f.totalBookingsAll || 0) === 0);

            const renderFieldCard = (field) => (
              <div key={field.id} className="field-card">
                <div className="field-card-header">
                  <div>
                    <div className="field-card-title">🏟️ #{field.id} - {field.name}</div>
                    <div className={field.isActive ? 'active' : 'inactive'} style={{ fontWeight: 700 }}>
                      {field.isActive ? '🟢 Hoạt động' : '🔴 Đang tắt'}
                    </div>
                  </div>
                  <div className="field-card-actions">
                    <button className="btn-toggle" onClick={() => handleToggleFieldStatus(field.id)} disabled={loading}>
                      {field.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button className="btn-toggle" onClick={() => handleDeleteFieldSafe(field.id)} disabled={loading}>
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="field-card-body">
                  <div className="field-card-row">
                    <div><strong>Giá/giờ:</strong> {parseFloat(field.pricePerHour).toFixed(4)} ETH</div>
                    <div><strong>Đã đặt:</strong> {field.totalBookingsAll} (Pending: {field.pendingCount})</div>
                  </div>
                  <div className="field-card-row">
                    <div><strong>Đặt sân đã xác nhận:</strong> {field.totalBookingsConfirmed}</div>
                    <div><strong>Doanh thu (confirmed):</strong> {parseFloat(field.totalRevenueConfirmed).toFixed(4)} ETH</div>
                  </div>

                  <div className="field-card-edit">
                    <label style={{ fontWeight: 700 }}>Sửa giá (ETH/giờ)</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceDraftByFieldId[field.id] ?? ''}
                        onChange={(e) => setPriceDraftByFieldId(prev => ({ ...prev, [field.id]: e.target.value }))}
                        style={{ maxWidth: 180 }}
                      />
                      <button className="btn-primary" type="button" onClick={() => handleQuickUpdatePrice(field.id)} disabled={loading}>
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );

            return (
              <div className="fields-split">
                <div className="fields-list-section">
                  <h2>✅ Danh sách sân đã đặt</h2>
                  {booked.length === 0 ? (
                    <div className="no-data">Chưa có sân nào được đặt</div>
                  ) : (
                    <div className="field-cards-grid">{booked.map(renderFieldCard)}</div>
                  )}
                </div>

                <div className="fields-list-section">
                  <h2>🆕 Danh sách sân chưa đặt</h2>
                  {unbooked.length === 0 ? (
                    <div className="no-data">Không còn sân nào chưa đặt</div>
                  ) : (
                    <div className="field-cards-grid">{unbooked.map(renderFieldCard)}</div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="tab-content">
          <h2>📅 Quản lý đặt sân</h2>

          <div className="form-section">
            <h3>⏳ Đặt sân chờ xác nhận</h3>
            {pendingBookings.length === 0 ? (
              <div>Không có đặt sân nào đang chờ.</div>
            ) : (
              <table className="fields-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sân</th>
                    <th>Người đặt</th>
                    <th>Thời gian</th>
                    <th>Đã trả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map((b) => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>#{b.fieldId} - {b.fieldName}</td>
                      <td>{b.userShort}</td>
                      <td>{ContractService.formatDate(b.startTime)} → {ContractService.formatDate(b.endTime)}</td>
                      <td>{parseFloat(b.amountPaid).toFixed(4)} ETH</td>
                      <td>
                        <button className="btn-toggle" onClick={() => handleConfirmBooking(b.id)} disabled={loading}>
                          Xác nhận
                        </button>
                        {' '}
                        <button className="btn-toggle" onClick={() => handleCancelBooking(b.id)} disabled={loading}>
                          Huỷ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="fields-list-section">
            <h3>📚 Tất cả đặt sân</h3>
            {allBookings.length === 0 ? (
              <div>Chưa có đặt sân nào.</div>
            ) : (
              <table className="fields-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sân</th>
                    <th>Người đặt</th>
                    <th>Trạng thái</th>
                    <th>Đã trả</th>
                    <th>Tạo lúc</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((b) => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>#{b.fieldId} - {b.fieldName}</td>
                      <td>{b.userShort}</td>
                      <td>{b.statusName}</td>
                      <td>{parseFloat(b.amountPaid).toFixed(4)} ETH</td>
                      <td>{ContractService.formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* FINANCIAL MANAGEMENT TAB */}
      {activeTab === 'balance' && adminSummary && (
        <div className="tab-content">
          <div className="balance-section">
            <h2>💰 Số dư tài khoản</h2>
            <div className="balance-display">
              <div className="balance-info">
                <p>Số dư có thể rút:</p>
                <h3>{parseFloat(adminSummary.adminBalance).toFixed(4)} ETH</h3>
              </div>
              <button
                className="btn-withdraw"
                onClick={handleWithdraw}
                disabled={loading || parseFloat(adminSummary.adminBalance) <= 0}
              >
                🏧 Rút tiền
              </button>
            </div>

            <div className="balance-breakdown">
              <h3>Tóm tắt</h3>
              <ul>
                <li>
                  <strong>Tổng doanh thu:</strong> {parseFloat(adminSummary.totalRevenue).toFixed(4)} ETH
                </li>
                <li>
                  <strong>Tổng số dư contract:</strong> {parseFloat(adminSummary.contractTotalBalance).toFixed(4)} ETH
                </li>
                <li>
                  <strong>Tổng đặt sân đã xác nhận:</strong> {adminSummary.totalBookings}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
