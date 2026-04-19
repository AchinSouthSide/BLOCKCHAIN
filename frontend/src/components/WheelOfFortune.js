import React, { useState, useEffect } from 'react';
import '../styles/WheelOfFortune.css';

/**
 * Wheel of Fortune Component
 * Shows a spinning wheel after user successfully books a field
 * Displays random prizes with messages
 */
function WheelOfFortune({ isOpen, onClose }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);  // Track if user has already spun

  const prizes = [
    {
      id: 1,
      name: 'Thẻ Nạp 500K',
      message: 'Chúc mừng bạn đã nhận Thẻ Nạp 500K. Hãy đến tạp hóa gần nhất và nói KHONGLAMMACOAN để nhận.',
      emoji: '💳',
      color: '#FF6B6B',
      image: '/prizes/grabmart-card.svg'
    },
    {
      id: 2,
      name: 'iPhone 17 Promax',
      message: 'Chúc mừng bạn đã nhận iPhone 17 Promax. Hãy đến tiệm điện thoại gần nhất và đưa mã 17PROMAX2026 để nhận.',
      emoji: '📱',
      color: '#4ECDC4',
      image: '/prizes/iphone-orange.svg'
    },
    {
      id: 3,
      name: 'Laptop MSI TITAN',
      message: 'Chúc mừng bạn đã nhận Laptop MSI TITAN. Hãy đến cửa hàng laptop gần nhất và nhập mã MSITITAN để nhận.',
      emoji: '💻',
      color: '#95E1D3',
      image: '/prizes/msi-laptop.svg'
    },
    {
      id: 4,
      name: 'Voucher Ăn Chay Miễn Phí Trọn Đời',
      message: 'Chúc mừng bạn đã nhận Voucher Ăn Chay Miễn Phí Trọn Đời. Hãy đến các lễ hội Phật giáo vào ngày rằm để sử dụng.',
      emoji: '🥗',
      color: '#FFD93D',
      image: '/prizes/voucher.svg'
    },
    {
      id: 5,
      name: 'Voucher Gym 12 tháng Miễn Phí',
      message: 'Chúc mừng bạn đã nhận Voucher Gym 12 tháng Miễn Phí. Hãy di chuyển 500m về phía Đông công trường A và nói cháu của bác 2 để nhận.',
      emoji: '💪',
      color: '#F38181',
      image: '/prizes/gym-voucher.svg'
    }
  ];

  // Auto-start spinning when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSpinning(false);
      setShowResult(false);
      setSelectedPrize(null);
      setHasSpun(false);  // Reset spin flag when modal opens
    }
  }, [isOpen]);

  const spinWheel = () => {
    if (isSpinning || hasSpun) return;  // Don't allow spinning if already spun

    setIsSpinning(true);
    setShowResult(false);

    // Random prize from 1 to 5
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prizeIndex = randomIndex;

    // Calculate rotation: each slice is 72 degrees (360/5)
    // We want the selected prize to land at the top (0 degrees)
    const sliceAngle = 360 / prizes.length;
    const targetRotation = 360 * 5 + (360 - (prizeIndex * sliceAngle + sliceAngle / 2));

    // Add random spin for more randomness
    const finalRotation = targetRotation + Math.random() * 360;

    // Spin animation
    let currentRotation = 0;
    const spinDuration = 4000; // 4 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      currentRotation = finalRotation * easeOut;

      setWheelRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setHasSpun(true);  // Mark that user has spun
        setSelectedPrize(prizes[prizeIndex]);
        setShowResult(true);
      }
    };

    requestAnimationFrame(animate);
  };

  if (!isOpen) return null;

  return (
    <div className="wheel-overlay" onClick={onClose}>
      <div className="wheel-container" onClick={(e) => e.stopPropagation()}>
        <button className="wheel-close-btn" onClick={onClose}>✕</button>

        <h2 className="wheel-title">🎡 VÒNG QUAY ƯU ĐÃI 🎡</h2>
        <p className="wheel-subtitle">Hãy quay để nhận phần thưởng!</p>

        {/* Wheel */}
        <div className="wheel-wrapper">
          <div className="wheel-pointer">📍</div>
          <svg
            className="wheel-svg"
            viewBox="0 0 400 400"
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            {prizes.map((prize, index) => {
              const angle = (index * 360) / prizes.length;
              const startAngle = angle;
              const endAngle = angle + 360 / prizes.length;

              const x1 = 200 + 180 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 200 + 180 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 200 + 180 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 200 + 180 * Math.sin((endAngle * Math.PI) / 180);

              const largeArc = 360 / prizes.length > 180 ? 1 : 0;

              const midAngle = (startAngle + endAngle) / 2;
              const textX = 200 + 120 * Math.cos((midAngle * Math.PI) / 180);
              const textY = 200 + 120 * Math.sin((midAngle * Math.PI) / 180);

              return (
                <g key={prize.id}>
                  <path
                    d={`M 200 200 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={prize.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fontSize="14"
                    fontWeight="bold"
                    fill="#000"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90} ${textX} ${textY})`}
                  >
                    {prize.emoji}
                  </text>
                </g>
              );
            })}

            {/* Center circle */}
            <circle cx="200" cy="200" r="40" fill="#fff" stroke="#333" strokeWidth="3" />
            <text
              x="200"
              y="200"
              fontSize="20"
              fontWeight="bold"
              fill="#333"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              QUAY
            </text>
          </svg>
        </div>

        {/* Spin Button */}
        <button
          className="spin-button"
          onClick={spinWheel}
          disabled={isSpinning || hasSpun}
          title={hasSpun ? "Bạn đã quay rồi!" : "Quay để nhận thưởng"}
        >
          {hasSpun ? '✓ ĐÃ QUAY' : isSpinning ? '🎡 ĐANG QUAY...' : '🎉 QUAY NGAY 🎉'}
        </button>

        {/* Result */}
        {showResult && selectedPrize && (
          <div className="result-container">
            <div className="result-card">
              {selectedPrize.image && (
                <div className="result-image">
                  <img src={selectedPrize.image} alt={selectedPrize.name} />
                </div>
              )}
              {!selectedPrize.image && (
                <div className="result-emoji">{selectedPrize.emoji}</div>
              )}
              <h3 className="result-title">{selectedPrize.name}</h3>
              <p className="result-message">{selectedPrize.message}</p>
              <p className="result-contact">📧 Liên hệ: 12345667@BC.com</p>
              <button className="result-button" onClick={onClose}>
                🎁 Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WheelOfFortune;
