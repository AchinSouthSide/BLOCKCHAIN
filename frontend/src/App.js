import React, { useState, useEffect } from 'react';
import './App.css';
import ContractService from './services/ContractService';
import FieldList from './components/FieldList';
import CreateField from './components/CreateField';
import BookingList from './components/BookingList';
import WalletConnect from './components/WalletConnect';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [contract, setContract] = useState(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const { isConnected, address, contractInstance } = await ContractService.connectWallet();
      if (isConnected) {
        setIsConnected(true);
        setUserAddress(address);
        setContract(contractInstance);
      }
    } catch (error) {
      console.log('Wallet not connected yet');
    }
  };

  const handleAccountsChanged = async () => {
    checkWalletConnection();
  };

  const handleNetworkChanged = async () => {
    // Check if we're on Sepolia (11155111) or localhost
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0xaa36a7' && chainId !== '0x7a69') { // Sepolia & Localhost
      alert('Vui lòng chuyển đến Sepolia testnet hoặc localhost');
    }
  };

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleNetworkChanged);
  }

  return (
    <div className="App">
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
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              🔍 Tìm sân
            </button>
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              ➕ Tạo sân
            </button>
            <button 
              className={`tab-btn ${activeTab === 'mybookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('mybookings')}
            >
              📅 Đặt sân của tôi
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'browse' && contract && <FieldList contract={contract} />}
            {activeTab === 'create' && contract && <CreateField contract={contract} />}
            {activeTab === 'mybookings' && contract && <BookingList contract={contract} userAddress={userAddress} />}
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
