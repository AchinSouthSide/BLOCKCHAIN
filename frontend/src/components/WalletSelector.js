/**
 * WalletSelector Component
 * Auto-detect tài khoản và setup network với Hardhat Local
 */

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ensureHardhatNetwork from '../utils/EnsureHardhatNetwork';
import { ethereumRequest, formatMetaMaskError } from '../utils/ethereumRequest';
import '../styles/WalletSelector.css';

function WalletSelector({ onSelectWallet, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorSteps, setErrorSteps] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [network, setNetwork] = useState('');

  useEffect(() => {
    // Auto-detect tất cả account
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorSteps([]);
      console.log('[WalletSelector] 🚀 Step 1/3: Starting account loading...');

      if (!window.ethereum) {
        throw new Error('MetaMask chưa được cài đặt. Vui lòng cài đặt MetaMask extension.');
      }

      // **STEP 1: Ensure Hardhat network setup**
      console.log('[WalletSelector] 🔧 Step 1/3: Setting up Hardhat network...');
      const networkSetup = await ensureHardhatNetwork();
      
      if (!networkSetup.success) {
        console.error('[WalletSelector] Network setup failed:', networkSetup.message);
        setError(networkSetup.message);
        setErrorSteps(networkSetup.steps || []);
        setLoading(false);
        return;
      }
      console.log('[WalletSelector] ✅ Hardhat network ready');

      // **STEP 2: Request accounts from MetaMask**
      console.log('[WalletSelector] 📋 Step 2/3: Requesting accounts...');
      let accounts = await ethereumRequest({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        accounts = await ethereumRequest({ method: 'eth_requestAccounts' });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('Không nhận được account từ MetaMask');
      }

      console.log('[WalletSelector] ✅ Accounts granted:', accounts.length);

      // **STEP 3: Get network and balances**
      console.log('[WalletSelector] 💰 Step 3/3: Loading balances and network info...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Verify network
      const netInfo = await provider.getNetwork();
      console.log('[WalletSelector] Current ChainID:', netInfo.chainId);
      
      let networkStatus = '';
      if (netInfo.chainId === 31337) {
        networkStatus = '✅ Hardhat Local (Sẵn sàng)';
      } else {
        networkStatus = `⚠️ Network ${netInfo.chainId} (Cảnh báo: Không phải Hardhat)`;
        console.warn('[WalletSelector] ⚠️ Not on Hardhat network. User should switch in MetaMask.');
      }
      setNetwork(networkStatus);

      // Load account balances
      const accountBalances = [];
      for (let i = 0; i < accounts.length; i++) {
        const balance = await provider.getBalance(accounts[i]);
        const balanceInEth = Number(ethers.formatEther(balance));
        accountBalances.push({
          address: accounts[i],
          balance: balanceInEth,
          index: i,
        });
        console.log(`[WalletSelector] ✅ Account #${i}: ${balanceInEth.toFixed(2)} ETH`);
      }

      setAccountList(accountBalances);
      setLoading(false);
      console.log('[WalletSelector] ✅ Accounts loaded. User must select manually.');

    } catch (err) {
      console.error('[WalletSelector] ❌ FATAL ERROR:', err);
      const code = err?.code ?? err?.data?.originalError?.code;
      if (code === 4002) {
        setError('❌ MetaMask không được kích hoạt. Vui lòng mở MetaMask và thử lại.');
      } else {
        setError('❌ ' + formatMetaMaskError(err));
      }
      setLoading(false);
    }
  };

  return (
    <div className="wallet-selector-overlay">
      <div className="wallet-selector-modal">
        <div className="wallet-selector-header">
          <h2>🦊 Chọn Ví MetaMask</h2>
          <p className="network-info">{network}</p>
        </div>

        <div className="wallet-selector-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p className="loading-message">🔧 Setting up Hardhat Local...</p>
              <p className="loading-message">📋 Loading your accounts...</p>
              <p style={{fontSize: '12px', color: '#666', marginTop: '20px'}}>{network}</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-message">{error}</div>
              
              {errorSteps && errorSteps.length > 0 && (
                <div className="error-steps" style={{marginTop: '20px', textAlign: 'left'}}>
                  <p style={{fontWeight: 'bold', marginBottom: '10px'}}>👇 Hướng dẫn:</p>
                  <ol style={{fontSize: '14px', lineHeight: '1.8', color: '#333'}}>
                    {errorSteps.map((step, idx) => (
                      <li key={idx} style={{marginBottom: '8px'}}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              <div className="wallet-selector-actions">
                <button className="btn-cancel" onClick={onCancel}>
                  Đóng
                </button>
                <button
                  className="btn-confirm"
                  onClick={() => {
                    setError('');
                    setErrorSteps([]);
                    setLoading(true);
                    loadAccounts();
                  }}
                >
                  🔄 Thử Lại
                </button>
              </div>
            </div>
          ) : accountList.length > 0 ? (
            <div className="account-list">
              <p className="account-list-title">💼 Chọn tài khoản:</p>
              {accountList.map((account, index) => (
                <button
                  key={account.address}
                  className={`account-option ${index === 0 ? 'recommended' : ''}`}
                  onClick={() => {
                    console.log('[WalletSelector] Selected account:', account.address);
                    onSelectWallet(account.address);
                  }}
                >
                  <div className="account-header">
                    <span className="account-badge">
                      {index === 0 ? '👑 Account #0' : `#${index}`}
                    </span>
                    <span className="account-balance">{account.balance.toFixed(0)} ETH</span>
                  </div>
                  <div className="account-address">
                    {account.address.substring(0, 10)}...{account.address.substring(38)}
                  </div>
                  {index === 0 && (
                    <div className="account-note">✅ Tài khoản Deploy (Khuyên dùng cho Admin)</div>
                  )}
                </button>
              ))}
              <div className="wallet-selector-actions">
                <button className="btn-cancel" onClick={onCancel}>
                  ❌ Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <div className="error-message">❌ Không tìm thấy tài khoản</div>
              <div className="wallet-selector-actions">
                <button className="btn-cancel" onClick={onCancel}>
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletSelector;
