import React, { useState, useEffect } from 'react';
import ContractService from '../services/ContractService';
import '../styles/Balance.css';

function Balance({ contract, userAddress, isPlatformOwner }) {
  const [earnings, setEarnings] = useState('0');
  const [platformEarnings, setPlatformEarnings] = useState('0');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (contract && userAddress) {
      loadEarnings();
      const interval = setInterval(loadEarnings, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [contract, userAddress]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const earningsData = await ContractService.getOwnerEarnings(contract, userAddress);
      setEarnings(earningsData);
      
      if (isPlatformOwner) {
        const platformEarningsData = await ContractService.getPlatformEarnings(contract);
        setPlatformEarnings(platformEarningsData);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (parseFloat(earnings) === 0) {
      alert('Chưa có doanh thu để rút');
      return;
    }

    if (!window.confirm(`Rút ${earnings} ETH từ doanh thu của bạn?`)) {
      return;
    }

    try {
      setWithdrawing(true);
      await ContractService.withdraw(contract);
      alert('Rút tiền thành công! ✅');
      await loadEarnings();
    } catch (error) {
      alert('Error withdrawing: ' + error.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawPlatformFee = async () => {
    if (parseFloat(platformEarnings) === 0) {
      alert('Chưa có phí platform để rút');
      return;
    }

    if (!window.confirm(`Rút ${platformEarnings} ETH phí platform?`)) {
      return;
    }

    try {
      setWithdrawing(true);
      await ContractService.withdrawPlatformFee(contract);
      alert('Rút phí platform thành công! ✅');
      await loadEarnings();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="balance-loading">⏳ Đang tải...</div>;

  return (
    <div className="balance-container">
      {/* ===== USER EARNINGS ===== */}
      <div className="earnings-card">
        <div className="earnings-header">
          <h3>💰 Doanh thu của bạn</h3>
          <span className="earnings-amount">{earnings} ETH</span>
        </div>
        <div className="earnings-info">
          <p>Tiền kiếm được từ việc cho thuê sân</p>
        </div>
        <button 
          className="withdraw-btn"
          onClick={handleWithdraw}
          disabled={parseFloat(earnings) === 0 || withdrawing}
        >
          {withdrawing ? '⏳ Đang rút...' : '🏦 Rút tiền'}
        </button>
      </div>

      {/* ===== PLATFORM EARNINGS (Only for Platform Owner) ===== */}
      {isPlatformOwner && (
        <div className="earnings-card platform-earnings">
          <div className="earnings-header">
            <h3>🏦 Phí Platform</h3>
            <span className="earnings-amount">{platformEarnings} ETH</span>
          </div>
          <div className="earnings-info">
            <p>Phí thu từ các giao dịch trên platform (5%)</p>
          </div>
          <button 
            className="withdraw-btn"
            onClick={handleWithdrawPlatformFee}
            disabled={parseFloat(platformEarnings) === 0 || withdrawing}
          >
            {withdrawing ? '⏳ Đang rút...' : '🏦 Rút phí'}
          </button>
        </div>
      )}

      {/* ===== INFO ===== */}
      <div className="balance-info">
        <h4>ℹ️ Thông tin</h4>
        <ul>
          <li>Doanh thu được tính toán khi đặt sân được hoàn thành</li>
          <li>Bạn có thể rút tiền bất cứ lúc nào khi có doanh thu</li>
          <li>Phí đơn vị là 5% cho mỗi giao dịch</li>
          <li>Tiền sẽ được chuyển trực tiếp vào ví MetaMask của bạn</li>
        </ul>
      </div>
    </div>
  );
}

export default Balance;
