/**
 * Main App Component với Authentication
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import AuthService from './services/AuthService';
import Login from './components/Login';
import Navbar from './components/Navbar';
import NetworkSwitcher from './components/NetworkSwitcher';
import AdminPanel from './components/AdminPanel';
import UserDashboard from './components/UserDashboard';

// Import ABI loader first (makes FIELD_BOOKING_ABI available globally)
import './services/abi/index.js';

// Import test suite
import TestRunner from './tests/UnitTests';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('[App] Initializing...');
    
    // COMPLETE RESET - Force logout on every page load
    AuthService.logout();
    localStorage.clear();
    sessionStorage.clear();
    console.log('[App] ✅ Complete reset - all sessions cleared & user logged out');
    
    // Disconnect from MetaMask provider completely
    if (window.ethereum) {
      // Remove all event listeners from previous session
      try {
        window.ethereum.removeAllListeners?.();
        console.log('[App] ✅ Removed all MetaMask event listeners');
      } catch (e) {
        console.log('[App] Event listener cleanup (optional)');
      }
    }
    
    // Make TestRunner available globally
    if (typeof window !== 'undefined') {
      window.TestRunner = TestRunner;
      console.log('✅ Test suite loaded. Type: TestRunner.runAll() in console to run tests');
    }
    
    console.log('[App] User must login fresh every page load');
    
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

    // Get provider from AuthService
    const providerInstance = AuthService.getProvider();
    if (providerInstance) {
      setProvider(providerInstance);
      console.log('[App] Provider loaded from AuthService');
    }
    
    // Add listeners for account/network changes
    if (window.ethereum) {
      // Listen for account changes
      const handleAccountsChanged = (accounts) => {
        console.warn('[App] MetaMask account changed! Force logout.');
        handleLogout();
      };
      
      // Listen for chain changes
      const handleChainChanged = (chainId) => {
        console.warn('[App] MetaMask network changed! Force logout.');
        handleLogout();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Store references for cleanup
      window._appAccountListener = handleAccountsChanged;
      window._appChainListener = handleChainChanged;
      
      console.log('[App] ✅ Added MetaMask change listeners');
    }
  };

  const handleLogout = () => {
    console.log('[App] Logging out...');
    AuthService.logout();
    setCurrentUser(null);
    setContract(null);
    setProvider(null);
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
        <NetworkSwitcher />
        {currentUser.role === 'admin' ? (
          <AdminPanel contract={contract} provider={provider} address={currentUser.address} />
        ) : (
          <UserDashboard contract={contract} user={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;
