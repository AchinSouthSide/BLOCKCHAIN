/**
 * Main App Component với Authentication
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import AuthService from './services/AuthService';
import ContractService from './services/ContractService';
import Login from './components/Login';
import Navbar from './components/Navbar';
import FieldList from './components/FieldList';
import CreateField from './components/CreateField';
import BookingList from './components/BookingList';
import BookingManagement from './components/BookingManagement';
import OwnerDashboard from './components/OwnerDashboard';
import Balance from './components/Balance';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('[App] Initializing...');
    const user = AuthService.getCurrentUser();
    
    if (user && user.isLoggedIn) {
      console.log('[App] Found existing user');
      const sessionData = AuthService.getSessionData();
      
      if (sessionData && sessionData.contract) {
        setCurrentUser(user);
        setContract(sessionData.contract);
        setIsLoggedIn(true);
      }
    }
    
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    console.log('[App] Login successful');
    setCurrentUser(user);
    setIsLoggedIn(true);
    
    const sessionData = AuthService.getSessionData();
    if (sessionData && sessionData.contract) {
      setContract(sessionData.contract);
    }
  };

  const handleLogout = () => {
    console.log('[App] Logging out');
    AuthService.logout();
    setCurrentUser(null);
    setContract(null);
    setIsLoggedIn(false);
    setActiveTab('browse');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>⏳ Đang tải...</p>
      </div>
    );
  }

  // Chưa đăng nhập - Show Login Screen
  if (!isLoggedIn || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Đã đăng nhập - Show Dashboard
  return (
    <div className="App">
      <Navbar user={currentUser} onLogout={handleLogout} />

      <main className="container">
        {/* Tab Navigation */}
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            🔍 Tìm sân
          </button>

          <button 
            className={`tab-btn ${activeTab === 'my-bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-bookings')}
          >
            📅 Đặt sân của tôi
          </button>

          <button 
            className={`tab-btn ${activeTab === 'booking-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking-management')}
          >
            📋 Quản lý booking
          </button>

          {/* Show admin tabs if user is admin */}
          {currentUser.role === 'admin' && (
            <>
              <div className="tab-separator"></div>
              
              <button 
                className={`tab-btn ${activeTab === 'owner-dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('owner-dashboard')}
              >
                👨‍💼 Dashboard
              </button>

              <button 
                className={`tab-btn ${activeTab === 'create-field' ? 'active' : ''}`}
                onClick={() => setActiveTab('create-field')}
              >
                ➕ Tạo sân
              </button>

              <button 
                className={`tab-btn ${activeTab === 'balance' ? 'active' : ''}`}
                onClick={() => setActiveTab('balance')}
              >
                💰 Doanh thu
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'browse' && contract && <FieldList contract={contract} />}
          
          {activeTab === 'my-bookings' && contract && (
            <BookingList contract={contract} userAddress={currentUser.address} />
          )}
          
          {activeTab === 'booking-management' && contract && (
            <BookingManagement contract={contract} userAddress={currentUser.address} />
          )}
          
          {currentUser.role === 'admin' && activeTab === 'owner-dashboard' && contract && (
            <OwnerDashboard contract={contract} userAddress={currentUser.address} />
          )}
          
          {currentUser.role === 'admin' && activeTab === 'create-field' && contract && (
            <CreateField contract={contract} />
          )}
          
          {currentUser.role === 'admin' && activeTab === 'balance' && contract && (
            <Balance contract={contract} userAddress={currentUser.address} isPlatformOwner={false} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
