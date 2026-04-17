/**
 * Admin Dashboard Component
 * Chỉ cho admin/chủ sân sử dụng
 */

import React, { useState, useEffect } from 'react';
import OwnerDashboard from './OwnerDashboard';
import CreateField from './CreateField';
import Balance from './Balance';
import '../styles/Dashboard.css';

function AdminDashboard({ contract, user }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('[AdminDashboard] Loaded with user:', user?.address);
  }, [user]);

  if (!contract || !user) {
    return <div>⏳ Loading...</div>;
  }

  const handleSectionChange = (section) => {
    console.log(`[AdminDashboard] Switched to ${section} section`);
    setActiveSection(section);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>👨‍💼 Admin Dashboard</h2>
        <p>Manage your fields, bookings, and earnings</p>
      </div>

      <div className="dashboard-actions">
        <button
          className={`action-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleSectionChange('dashboard')}
          disabled={isLoading}
        >
          📊 Dashboard
        </button>
        <button
          className={`action-btn ${activeSection === 'create-field' ? 'active' : ''}`}
          onClick={() => handleSectionChange('create-field')}
          disabled={isLoading}
        >
          ➕ Create Field
        </button>
        <button
          className={`action-btn ${activeSection === 'balance' ? 'active' : ''}`}
          onClick={() => handleSectionChange('balance')}
          disabled={isLoading}
        >
          💰 My Balance
        </button>
      </div>

      <div className="dashboard-sections">
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
            <p>Loading...</p>
          </div>
        )}

        {!isLoading && activeSection === 'dashboard' && (
          <OwnerDashboard contract={contract} userAddress={user.address} />
        )}

        {!isLoading && activeSection === 'create-field' && (
          <CreateField contract={contract} />
        )}

        {!isLoading && activeSection === 'balance' && (
          <Balance contract={contract} userAddress={user.address} isPlatformOwner={false} />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
