/**
 * User Dashboard Component
 * Cho user bình thường sử dụng
 */

import React, { useState, useEffect } from 'react';
import FieldList from './FieldList';
import BookingList from './BookingList';
import BookingManagement from './BookingManagement';
import '../styles/Dashboard.css';

function UserDashboard({ contract, user }) {
  const [activeSection, setActiveSection] = useState('browse');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('[UserDashboard] Loaded with user:', user?.address);
  }, [user]);

  if (!contract || !user) {
    return <div>⏳ Loading...</div>;
  }

  const handleSectionChange = (section) => {
    console.log(`[UserDashboard] Switched to ${section} section`);
    setActiveSection(section);
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>👤 User Dashboard</h2>
        <p>Browse fields, manage your bookings, and track your activities</p>
      </div>

      <div className="dashboard-actions">
        <button 
          className={`action-btn ${activeSection === 'browse' ? 'active' : ''}`}
          onClick={() => handleSectionChange('browse')}
          disabled={isLoading}
        >
          🔍 Browse Fields
        </button>
        <button 
          className={`action-btn ${activeSection === 'my-bookings' ? 'active' : ''}`}
          onClick={() => handleSectionChange('my-bookings')}
          disabled={isLoading}
        >
          📅 My Bookings
        </button>
        <button 
          className={`action-btn ${activeSection === 'manage' ? 'active' : ''}`}
          onClick={() => handleSectionChange('manage')}
          disabled={isLoading}
        >
          📋 Manage
        </button>
      </div>

      <div className="dashboard-sections">
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
            <p>Loading...</p>
          </div>
        )}

        {!isLoading && activeSection === 'browse' && (
          <FieldList contract={contract} />
        )}

        {!isLoading && activeSection === 'my-bookings' && (
          <BookingList contract={contract} userAddress={user.address} />
        )}

        {!isLoading && activeSection === 'manage' && (
          <BookingManagement contract={contract} userAddress={user.address} />
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
