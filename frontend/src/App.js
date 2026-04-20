/**
 * Main App Component với Authentication
 */

import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/StatusBadge.css';
import AuthService from './services/AuthService';
import ContractService from './services/ContractService';
import { ethereumRequest } from './utils/ethereumRequest';
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
    
    // Make TestRunner available globally
    if (typeof window !== 'undefined') {
      window.TestRunner = TestRunner;
      console.log('✅ Test suite loaded. Type: TestRunner.runAll() in console to run tests');
    }
    
    const restoreSession = async () => {
      try {
        const savedUser = AuthService.getCurrentUser();
        if (!savedUser || !savedUser.address || !savedUser.isLoggedIn) {
          return;
        }

        if (AuthService.isSessionExpired?.()) {
          AuthService.logout();
          return;
        }

        if (!window.ethereum) {
          return;
        }

        const accounts = await ethereumRequest({ method: 'eth_accounts' });
        const lowerAccounts = (accounts || []).map(a => String(a).toLowerCase());
        const savedLower = String(savedUser.address).toLowerCase();
        if (!lowerAccounts.includes(savedLower)) {
          return;
        }

        const contractData = await ContractService.connectWallet(savedUser.address);
        const user = AuthService.login(savedUser.address, savedUser.role, contractData);

        setCurrentUser(user);
        setIsLoggedIn(true);
        setContract(contractData.contract);
        setProvider(contractData.provider);

        console.log('[App] ✅ Session restored:', { address: savedUser.address, role: savedUser.role });
      } catch (e) {
        console.warn('[App] Session restore skipped:', e?.message || e);
      }
    };

    restoreSession().finally(() => setLoading(false));
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
      // Remove any previous listeners we registered (avoid duplicates)
      try {
        if (window._appAccountListener) {
          window.ethereum.removeListener('accountsChanged', window._appAccountListener);
        }
        if (window._appChainListener) {
          window.ethereum.removeListener('chainChanged', window._appChainListener);
        }
      } catch (e) {
        // optional
      }

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

    if (window.ethereum) {
      try {
        if (window._appAccountListener) {
          window.ethereum.removeListener('accountsChanged', window._appAccountListener);
        }
        if (window._appChainListener) {
          window.ethereum.removeListener('chainChanged', window._appChainListener);
        }
      } catch (e) {
        // optional
      }
    }
    delete window._appAccountListener;
    delete window._appChainListener;

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
