/**
 * Inbox Component
 * Displays notifications and messages for user/admin
 */

import React, { useState, useEffect, useCallback } from 'react';
import ContractService from '../services/ContractService';
import '../styles/Inbox.css';

function Inbox({ contract, userAddress, role }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState(() => new Set());

  const getHiddenStorageKey = useCallback(() => {
    const contractAddress = contract?.target || contract?.address || 'unknown_contract';
    const safeUser = userAddress || 'unknown_user';
    return `fieldbooking_hidden_notifications:${contractAddress}:${safeUser}`;
  }, [contract, userAddress]);

  const loadHiddenIdsFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(getHiddenStorageKey());
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed);
    } catch {
      return new Set();
    }
  }, [getHiddenStorageKey]);

  const persistHiddenIdsToStorage = useCallback((nextSet) => {
    try {
      localStorage.setItem(getHiddenStorageKey(), JSON.stringify(Array.from(nextSet)));
    } catch {
      // ignore storage errors
    }
  }, [getHiddenStorageKey]);

  useEffect(() => {
    // Reload hidden IDs when wallet/contract changes
    setHiddenNotificationIds(loadHiddenIdsFromStorage());
  }, [loadHiddenIdsFromStorage]);

  const fetchNotifications = useCallback(async ({ showSpinner = false } = {}) => {
    try {
      if (showSpinner) setLoading(true);
      setError('');
      const notificationsData = await ContractService.getUserNotifications(contract, userAddress);
      const hiddenIds = loadHiddenIdsFromStorage();
      const filtered = (notificationsData || []).filter(n => !hiddenIds.has(n.id));
      const deduped = Array.from(
        new Map(filtered.map(n => [n.id, n])).values()
      );
      setHiddenNotificationIds(hiddenIds);
      setNotifications(deduped);
    } catch (err) {
      console.error('[Inbox] Error loading notifications:', err);
      setError('Lỗi tải hộp thư');
      setNotifications([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [contract, userAddress, loadHiddenIdsFromStorage]);

  useEffect(() => {
    fetchNotifications({ showSpinner: true });

    // Poll for new notifications every 5 seconds.
    // IMPORTANT: Pause polling while user is viewing a message (modal open)
    // to avoid re-renders that can reset scroll position.
    if (selectedNotification) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotifications, selectedNotification]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await ContractService.markNotificationAsRead(contract, notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('[Inbox] Error marking notification:', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    // Require user to confirm they memorized the info
    const confirmed = window.confirm(
      '⚠️ Bạn đã ghi nhớ mã vé/thông tin?\n\n' +
      'Sau khi xóa không thể khôi phục!'
    );
    
    if (!confirmed) return;

    try {
      // Persist a per-wallet "hidden" list so the item won't reappear on auto-refresh.
      const nextHidden = new Set(hiddenNotificationIds);
      nextHidden.add(notificationId);
      setHiddenNotificationIds(nextHidden);
      persistHiddenIdsToStorage(nextHidden);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setSelectedNotification(null);
    } catch (err) {
      console.error('[Inbox] Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'booking_created': '📅',
      'booking_confirmed': '✅',
      'booking_cancelled': '❌',
      'booking_waiting': '⏳',
      'ticket_ready': '🎟️'
    };
    return icons[type] || '📧';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'booking_created': '#3498db',
      'booking_confirmed': '#27ae60',
      'booking_cancelled': '#e74c3c',
      'booking_waiting': '#f39c12',
      'ticket_ready': '#9b59b6'
    };
    return colors[type] || '#95a5a6';
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  // Only show full loading placeholder on first load (no data yet).
  // During background polling, keep UI stable to prevent scroll jumps.
  if (loading && notifications.length === 0) {
    return <div className="inbox-loading">📬 Đang tải thư...</div>;
  }

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h2>📬 Hộp Thư ({filteredNotifications.length})</h2>
        <div className="inbox-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Chưa đọc ({notifications.filter(n => !n.read).length})
          </button>
          <button className="refresh-btn" onClick={() => fetchNotifications({ showSpinner: true })}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#ffe0e0',
          border: '2px solid #ff6b6b',
          color: '#dc3545',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="inbox-content">
        {filteredNotifications.length === 0 ? (
          <div className="inbox-empty">
            <p>📭 Không có thông báo</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => {
                  setSelectedNotification(notification);
                  if (!notification.read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                style={{ borderLeftColor: getNotificationColor(notification.notificationType) }}
              >
                <div className="notification-header">
                  <span className="notification-icon">
                    {getNotificationIcon(notification.notificationType)}
                  </span>
                  <div className="notification-info">
                    <p className="notification-type">{notification.notificationType}</p>
                    <p className="notification-time">
                      {new Date(notification.createdAt * 1000).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {!notification.read && <span className="unread-badge">●</span>}
                </div>
                <p className="notification-message">{notification.message}</p>
                {notification.ticketId && notification.ticketId.trim() && (
                  <div className="ticket-info">
                    <span className="ticket-label">🎟️ Mã vé:</span>
                    <span className="ticket-id">{notification.ticketId.substring(0, 16)}...</span>
                    <button
                      className="copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(notification.ticketId);
                        alert('Đã sao chép mã vé!');
                      }}
                    >
                      📋 Sao chép
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="notification-modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedNotification.notificationType}</h3>
              <button className="close-btn" onClick={() => setSelectedNotification(null)}>✕</button>
            </div>
            <div className="modal-content">
              <p className="modal-message">{selectedNotification.message}</p>
              {selectedNotification.ticketId && selectedNotification.ticketId.trim() && (
                <div className="modal-ticket">
                  <h4>🎟️ Mã Vé Vào Sân</h4>
                  <div className="ticket-box">
                    <code>{selectedNotification.ticketId}</code>
                    <button
                      className="copy-btn-large"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedNotification.ticketId);
                        alert('Đã sao chép mã vé!');
                      }}
                    >
                      📋 Sao chép Mã Vé
                    </button>
                  </div>
                </div>
              )}
              <div className="modal-meta">
                <p><strong>Booking ID:</strong> #{selectedNotification.relatedBookingId}</p>
                <p><strong>Thời gian:</strong> {new Date(selectedNotification.createdAt * 1000).toLocaleString('vi-VN')}</p>
              </div>
              <div className="modal-actions">
                <button
                  className="delete-msg-btn"
                  onClick={() => handleDeleteNotification(selectedNotification.id)}
                >
                  🗑️ Xóa Thư
                </button>
                <button
                  className="close-modal-btn"
                  onClick={() => setSelectedNotification(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inbox;
