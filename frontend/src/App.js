/**
 * Main App Component với Authentication
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import AuthService from './services/AuthService';
import Login from './components/Login';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

// Import test suite
import TestRunner from './tests/UnitTests';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('[App] Initializing...');
    
    // Make TestRunner available globally
    if (typeof window !== 'undefined') {
      window.TestRunner = TestRunner;
      console.log('✅ Test suite loaded. Type: TestRunner.runAll() in console to run tests');
    }
    
    const user = AuthService.getCurrentUser();
    
    if (user && user.isLoggedIn) {
      console.log('[App] Found existing user:', user.address, 'role:', user.role);
      
      // Get contract from memory
      const contract = AuthService.getContract();
      
      if (contract) {
        setCurrentUser(user);
        setContract(contract);
        setIsLoggedIn(true);
        console.log('[App] Contract restored from memory');
      } else {
        console.log('[App] Contract not found in memory, clearing auth');
        AuthService.logout();
      }
    }
    
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user, contractData) => {
    console.log('[App] Login successful for user:', user.address, 'role:', user.role);
    setCurrentUser(user);
    setIsLoggedIn(true);
    
    // Get contract from memory (AuthService stores it in memory)
    const contract = AuthService.getContract();
    if (contract) {
      setContract(contract);
      console.log('[App] Contract loaded from AuthService');
    }
  };

  const handleLogout = () => {
    console.log('[App] Logging out...');
    AuthService.logout();
    setCurrentUser(null);
    setContract(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>⏳ Loading...</p>
      </div>
    );
  }

  // Chưa đăng nhập - Show Login Screen
  if (!isLoggedIn || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Đã đăng nhập - Show appropriate dashboard based on role
  return (
    <div className="App">
      <Navbar user={currentUser} onLogout={handleLogout} />

      <main className="container">
        {currentUser.role === 'admin' ? (
          <AdminDashboard contract={contract} user={currentUser} />
        ) : (
          <UserDashboard contract={contract} user={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;
