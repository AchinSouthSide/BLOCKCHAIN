import React, { useState, useEffect } from 'react';
import './App.css';
import ContractService from './services/ContractService';
import FieldList from './components/FieldList';
import CreateField from './components/CreateField';
import BookingList from './components/BookingList';
import BookingManagement from './components/BookingManagement';
import OwnerDashboard from './components/OwnerDashboard';
import Balance from './components/Balance';
import WalletConnect from './components/WalletConnect';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [contract, setContract] = useState(null);
  const [isPlatformOwner, setIsPlatformOwner] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const result = await ContractService.connectWallet();
      if (result.isConnected) {
        setIsConnected(true);
        setUserAddress(result.address);
        setContract(result.contract);
        
        // Check if user is platform owner
        const platformOwner = await result.contract.platformOwner();
        setIsPlatformOwner(platformOwner.toLowerCase() === result.address.toLowerCase());
      }
    } catch (error) {
      console.log('Wallet not connected yet');
    }
  };

  const handleAccountsChanged = async () => {
    checkWalletConnection();
  };

  const handleNetworkChanged = async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0xaa36a7' && chainId !== '0x7a69') {
      alert('Vui lòng chuyển đến Sepolia testnet hoặc localhost');
    }
  };

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleNetworkChanged);
  }

  return (
    <div className="App">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🏟️ FieldBooking</h1>
          <p>Đặt sân thể thao trên blockchain</p>
        </div>
        <WalletConnect 
          isConnected={isConnected} 
          userAddress={userAddress}
          onConnect={checkWalletConnection}
        />
      </nav>

      {isConnected ? (
        <main className="container">
          {/* ===== TAB BUTTONS ===== */}
          <div className="tab-buttons">
            {/* Common tabs */}
            <button 
              className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
              title="Duyệt và đặt sân"
            >
              🔍 Tìm sân
            </button>

            <button 
              className={`tab-btn ${activeTab === 'my-bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-bookings')}
              title="Xem các đặt sân của bạn"
            >
              📅 Đặt sân của tôi
            </button>

            <button 
              className={`tab-btn ${activeTab === 'booking-management' ? 'active' : ''}`}
              onClick={() => setActiveTab('booking-management')}
              title="Quản lý đặt sân"
            >
              📋 Quản lý booking
            </button>

            {/* Separator */}
            <div className="tab-separator"></div>

            {/* Owner tabs */}
            <button 
              className={`tab-btn ${activeTab === 'owner-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('owner-dashboard')}
              title="Dashboard chủ sân"
            >
              👨‍💼 Dashboard
            </button>

            <button 
              className={`tab-btn ${activeTab === 'create-field' ? 'active' : ''}`}
              onClick={() => setActiveTab('create-field')}
              title="Tạo sân mới"
            >
              ➕ Tạo sân
            </button>

            <button 
              className={`tab-btn ${activeTab === 'balance' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance')}
              title="Xem doanh thu và rút tiền"
            >
              💰 Doanh thu
            </button>
          </div>

          {/* ===== TAB CONTENT ===== */}
          <div className="tab-content">
            {/* BROWSE FIELDS */}
            {activeTab === 'browse' && contract && (
              <FieldList contract={contract} />
            )}

            {/* MY BOOKINGS */}
            {activeTab === 'my-bookings' && contract && (
              <BookingList contract={contract} userAddress={userAddress} />
            )}

            {/* BOOKING MANAGEMENT */}
            {activeTab === 'booking-management' && contract && (
              <BookingManagement contract={contract} userAddress={userAddress} />
            )}

            {/* OWNER DASHBOARD */}
            {activeTab === 'owner-dashboard' && contract && (
              <OwnerDashboard contract={contract} userAddress={userAddress} />
            )}

            {/* CREATE FIELD */}
            {activeTab === 'create-field' && contract && (
              <CreateField contract={contract} />
            )}

            {/* BALANCE / EARNINGS */}
            {activeTab === 'balance' && contract && (
              <Balance 
                contract={contract} 
                userAddress={userAddress}
                isPlatformOwner={isPlatformOwner}
              />
            )}
          </div>
        </main>
      ) : (
        <main className="container">
          <div className="connect-wallet-message">
            <h2>⚠️ Chưa kết nối ví</h2>
            <p>Vui lòng kết nối MetaMask để sử dụng ứng dụng</p>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
