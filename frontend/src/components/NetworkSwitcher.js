import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService.js';
import NetworkConfig from '../services/NetworkConfig.js';
import '../styles/NetworkSwitcher.css';

function NetworkSwitcher() {
  const [currentNetwork, setCurrentNetwork] = useState('Hardhat Local');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const networks = [
    { id: 31337, name: 'Hardhat Local', type: 'local' },
    { id: 11155111, name: 'Sepolia Testnet', type: 'testnet' },
    // Mainnet intentionally not exposed in UI
    // { id: 1, name: 'Ethereum Mainnet', type: 'mainnet' },
  ];

  // Update current network on mount
  useEffect(() => {
    const current = NetworkConfig.getCurrent();
    setCurrentNetwork(current.name);
    console.log('[NetworkSwitcher] Initialized with network:', current.name);
  }, []);

  const handleNetworkChange = async (networkName) => {
    if (networkName === currentNetwork) {
      console.log('[NetworkSwitcher] Already on', networkName);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[NetworkSwitcher] Switching to:', networkName);
      
      // Show warning for mainnet
      if (networkName === 'Ethereum Mainnet') {
        const confirmed = window.confirm(
          '⚠️ WARNING: You are switching to Ethereum Mainnet!\n\n' +
          'Real ETH will be required for transactions.\n\n' +
          'Are you sure you want to continue?'
        );
        if (!confirmed) {
          setIsLoading(false);
          return;
        }
      }

      await ContractService.switchNetwork(networkName);
      
      setCurrentNetwork(networkName);
      console.log('[NetworkSwitcher] ✅ Successfully switched to:', networkName);
      
      // Optional: Show success message
      setTimeout(() => {
        alert('✅ Network switched successfully to ' + networkName);
      }, 500);
    } catch (err) {
      console.error('[NetworkSwitcher] Error switching network:', err);
      setError(err.message || 'Failed to switch network');
      
      // Show error alert
      setTimeout(() => {
        alert('❌ Error: ' + (err.message || 'Failed to switch network'));
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkColor = (networkName) => {
    switch (networkName) {
      case 'Hardhat Local':
        return 'local';
      case 'Sepolia Testnet':
        return 'testnet';
      case 'Ethereum Mainnet':
        return 'mainnet';
      default:
        return 'unknown';
    }
  };

  const getNetworkIcon = (networkName) => {
    switch (networkName) {
      case 'Hardhat Local':
        return '🔧';
      case 'Sepolia Testnet':
        return '🧪';
      case 'Ethereum Mainnet':
        return '💎';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="network-switcher">
      <div className="network-info">
        <span className="network-icon">{getNetworkIcon(currentNetwork)}</span>
        <span className="network-label">
          Network: <strong className={`network-name ${getNetworkColor(currentNetwork)}`}>
            {currentNetwork}
          </strong>
        </span>
      </div>

      <div className="network-dropdown">
        <label htmlFor="network-select">Switch Network:</label>
        <select
          id="network-select"
          value={currentNetwork}
          onChange={(e) => handleNetworkChange(e.target.value)}
          disabled={isLoading}
          className={`network-select ${getNetworkColor(currentNetwork)}`}
        >
          {networks.map((network) => (
            <option key={network.id} value={network.name}>
              {getNetworkIcon(network.name)} {network.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="network-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="network-loading">
          <span className="spinner"></span>
          <span>Switching network...</span>
        </div>
      )}

      <div className="network-details">
        <small>
          {currentNetwork === 'Ethereum Mainnet' && '⚠️ Real ETH required'}
          {currentNetwork === 'Sepolia Testnet' && '✅ Free test ETH available'}
          {currentNetwork === 'Hardhat Local' && '✅ Local testing environment'}
        </small>
      </div>
    </div>
  );
}

export default NetworkSwitcher;
