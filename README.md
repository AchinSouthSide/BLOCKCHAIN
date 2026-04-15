# 🏟️ FieldBooking - Blockchain-based Field Booking System

**Hệ thống đặt sân thể thao trên blockchain với Smart Contract, React Frontend và MetaMask integration**

---

## 📋 MỤC LỤC

1. [Cấu trúc dự án](#-cấu-trúc-dự-án)
2. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
3. [Cài đặt](#-cài-đặt)
4. [Triển khai Smart Contract](#-triển-khai-smart-contract)
5. [Chạy Frontend](#-chạy-frontend)
6. [Kết nối MetaMask](#-kết-nối-metamask)
7. [Test Cases](#-test-cases)
8. [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
9. [Flow thực tế](#-flow-thực-tế)
10. [Troubleshooting](#-troubleshooting)

---

## 📁 Cấu trúc dự án

```
FieldBooking/
├── contracts/                 # Smart Contract Solidity
│   └── FieldBooking.sol      # Smart contract chính
├── scripts/
│   └── deploy.js             # Script triển khai
├── test/
│   └── FieldBooking.test.js  # Test cases
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── WalletConnect.js
│   │   │   ├── FieldList.js
│   │   │   ├── CreateField.js
│   │   │   └── BookingList.js
│   │   ├── services/
│   │   │   ├── ContractService.js
│   │   │   └── abi/FieldBooking.json
│   │   ├── styles/          # CSS files
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── hardhat.config.js         # Hardhat config
├── package.json              # Dependencies
├── .env.example              # Example environment variables
└── README.md                 # Documentation
```

---

## ⚙️ Yêu cầu hệ thống

- **Node.js**: v16 trở lên
- **npm**: v8 trở lên
- **MetaMask**: Browser extension
- **Internet Connection**: Để kết nối với Sepolia testnet

**Kiểm tra phersion:**
```bash
node --version
npm --version
```

---

## 🚀 Cài đặt

### 1. Clone hoặc tạo thư mục project

```bash
cd "C:\Users\AChin\Desktop\BlockChain\FieldBooking"
```

### 2. Cài đặt dependencies Backend

```bash
npm.cmd install
```

### 3. Cài đặt dependencies Frontend

```bash
npm.cmd run install-frontend
```

---

## 📝 Triển khai Smart Contract

### Option 1: Deploy trên Localhost (Khuyến nghị cho phát triển)

#### Bước 1: Chạy Hardhat Node

Mở **Terminal 1** và chạy:
```bash
cd "C:\Users\AChin\Desktop\BlockChain\FieldBooking"
npm.cmd run hardhat-node
```

Kết quả:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

**Sao chép 1 địa chỉ ví từ danh sách (Local Accounts)** - sẽ dùng trong MetaMask

#### Bước 2: Deploy Contract

Mở **Terminal 2** (thư mục khác hoặc cùng):
```bash
cd "C:\Users\AChin\Desktop\BlockChain\FieldBooking"
npm.cmd run deploy
```

Kết quả:
```
🚀 Deploying FieldBooking contract...
📝 Deploying with account: 0x...
💰 Account balance: 10000.0 ETH
✅ FieldBooking deployed to: 0x5FbDB2315678afccB333f8a9c45b65d30C7b3B42
📄 Deployment data saved to deployment.json
```

**Lưu lại contract address**: `0x5FbDB2315678afccB333f8a9c45b65d30C7b3B42`

---

### Option 2: Deploy trên Sepolia Testnet (Thực tế)

#### Bước 1: Tạo file `.env`

Tại thư mục gốc (`C:\Users\AChin\Desktop\BlockChain\FieldBooking\`), tạo file `.env`:

```env
# Sepolia Testnet RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Hoặc sử dụng Alchemy
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Private key của wallet (KHÔNG chia sẻ!)
PRIVATE_KEY=0x...

# Etherscan API key (để verify contract)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

#### Bước 2: Lấy RPC URL

**Từ Infura:**
1. Tạo tài khoản tại https://infura.io
2. Tạo project
3. Chọn Sepolia testnet
4. Copy API key

**Từ Alchemy:**
1. Tạo tài khoản tại https://www.alchemy.com
2. Tạo app với Sepolia network
3. Copy API URL

#### Bước 3: Lấy Private Key

1. Mở MetaMask
2. Account Details → Export Private Key
3. Copy (bắt đầu với `0x`)

#### Bước 4: Lấy Sepolia ETH (Testnet)

1. Truy cập faucet: https://www.sepoliafaucet.io/
2. Paste địa chỉ ví MetaMask
3. Nhận testnet ETH (mất vài phút)

#### Bước 5: Deploy

```bash
npm.cmd run deploy:sepolia
```

---

## 🌐 Chạy Frontend

### Bước 1: Cập nhật Contract Address

Mở file `.env` trong thư mục `frontend/`:

```env
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afccB333f8a9c45b65d30C7b3B42
REACT_APP_NETWORK_ID=1337  # 1337 cho localhost, 11155111 cho Sepolia
```

### Bước 2: Chạy React App

```bash
npm.cmd run frontend
```

Ứng dụng sẽ mở tại: **http://localhost:3000**

---

## 🦊 Kết nối MetaMask

### Setup cho Localhost

1. **Mở MetaMask** → Settings → Networks → Add Network

2. **Nhập thông tin:**
   - Network Name: `Hardhat Localhost`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. **Lưu** và chọn network này

4. **Import Account:**
   - Click biểu tượng → Import Account
   - Paste private key từ Hardhat node
   - Chọn "Import"

### Setup cho Sepolia

1. **MetaMask** tự động hỗ trợ Sepolia
2. Chỉ cần chọn "Sepolia test network" từ dropdown

---

## ✅ Test Cases

Chạy test suite:

```bash
npm.cmd run test
```

### Test Scenarios

#### 1️⃣ **Tạo Sân (Create Field)**

```javascript
✅ Should create a field successfully
✅ Should emit FieldCreated event
❌ Should fail if price is 0
❌ Should fail if name is empty
```

**Test Flow:**
- Người chủ sân tạo sân mới
- Kiểm tra thông tin được lưu
- Kiểm tra validation

#### 2️⃣ **Đặt Sân (Create Booking)**

```javascript
✅ Should create booking successfully
✅ Should emit BookingCreated event
❌ Should fail if booking in the past
❌ Should fail if insufficient payment
❌ Should detect time conflicts
```

**Test Flow:**
- Người dùng đặt sân cho ngày mai
- Hệ thống tính giá = Giờ × Giá/giờ
- Kiểm tra xung đột thời gian

#### 3️⃣ **Xác Nhận Đặt Sân (Confirm Booking)**

```javascript
✅ Should confirm booking
✅ Should emit BookingConfirmed event
❌ Should not allow non-owner to confirm
```

**Test Flow:**
- Chủ sân xác nhận đặt sân
- Trạng thái thay đổi từ "Chờ xác nhận" → "Đã xác nhận"

#### 4️⃣ **Check-in**

```javascript
✅ Should check-in successfully
✅ Should emit CheckinCompleted event
```

**Test Flow:**
- Khi đến giờ, người dùng check-in
- Trạng thái thay đổi thành "Đã check-in"

#### 5️⃣ **Hoàn thành Đặt Sân (Complete Booking)**

```javascript
✅ Should complete booking after end time
✅ Should distribute earnings
```

**Test Flow:**
- Sau khi hết giờ
- Tiền được chia cho chủ sân
- Platform nhận 5% fee

#### 6️⃣ **Hoàn Tiền (Refund)**

```javascript
✅ Should refund pending booking
✅ Should emit RefundProcessed event
```

**Test Flow:**
- Hủy đặt sân trong trạng thái "Chờ xác nhận"
- Tiền được hoàn về ví

### Chạy Test Cụ Thể

```bash
# Chạy toàn bộ test
npm.cmd run test

# Chạy test với output chi tiết
npm.cmd run test -- --reporter spec

# Chạy test file cụ thể
npm.cmd run test test/FieldBooking.test.js
```

---

## 📖 Hướng dẫn sử dụng

### Cho Người Dùng (Người Đặt Sân)

#### 🔍 Tìm Sân

1. Vào tab **"🔍 Tìm sân"**
2. Xem danh sách các sân
3. Click **"Đặt sân →"** trên sân bạn muốn

#### 📅 Đặt Sân

1. **Chọn ngày bắt đầu** và **giờ bắt đầu**
2. **Chọn ngày kết thúc** và **giờ kết thúc**
3. Hệ thống tính toán:
   - Thời gian = Giờ kết thúc - Giờ bắt đầu
   - Tổng giá = Thời gian × Giá/giờ
4. Click **"Xác nhận đặt sân"**
5. MetaMask yêu cầu xác nhận giao dịch
6. Chờ giao dịch thành công

#### ✅ Quản Lý Đặt Sân

1. Vào tab **"📅 Đặt sân của tôi"**
2. Xem trạng thái tất cả đặt sân:
   - **🟨 Chờ xác nhận** - Chủ sân chưa xác nhận
   - **🔵 Đã xác nhận** - Chốt sân
   - **🟢 Đã check-in** - Đang sử dụng
   - **⚫ Hoàn thành** - Kết thúc
   - **🔴 Đã huỷ** - Bị hủy
   - **🔗 Đã hoàn tiền** - Nhận tiền hoàn

3. **Hủy đặt sân** nếu chưa được xác nhận
4. **Check-in** khi đến giờ

---

### Cho Chủ Sân (Người Cho Thuê Sân)

#### ➕ Tạo Sân

1. Vào tab **"➕ Tạo sân"**
2. Nhập thông tin:
   - **Tên sân**: VD "Sân bóng đá A"
   - **Địa điểm**: VD "123 Đường ABC, TP HCM"
   - **Mô tả**: VD "Sân bóng 5 người, có mái che"
   - **Giá (ETH/giờ)**: VD "0.1"
3. Click **"✓ Tạo sân"**
4. MetaMask xác nhận
5. Sân được đưa lên platform

#### 💰 Quản Lý Lợi Nhuận

1. Mỗi khi đặt sân hoàn thành:
   - Bạn nhận: 95% tiền đặt sân
   - Platform nhận: 5% (fee duy trì hệ thống)

2. Rút tiền kiếm được:
   - Vào profile → Rút tiền
   - Tiền sẽ chuyển vào ví MetaMask

---

## 🎯 Flow Thực Tế

### Kịch Bản Hoàn Chỉnh

**Người chơi:** Alice (chủ sân), Bob (người đặt sân)

#### Bước 1: Alice tạo sân
```
Thời gian: 10:00 AM
- Alice tạo "Sân bóng đá A"
- Giá: 0.1 ETH/giờ
- Trạng thái: ✅ Active
```

#### Bước 2: Bob tìm và đặt sân
```
Thời gian: 11:30 AM
- Bob vào "Tìm sân"
- Thấy "Sân bóng đá A"
- Chọn ngày hôm nay từ 14:00 - 16:00 (2 giờ)
- Tổng giá = 2 × 0.1 = 0.2 ETH
- Bob gửi giao dịch
```

**Smart Contract xử lý:**
```
1. Kiểm tra xung đột thời gian ✅
2. Kiểm tra số tiền đủ ✅
3. Tạo Booking (trạng thái = 0: Pending)
4. Lưu tiền vào contract
5. Emit BookingCreated event
```

#### Bước 3: Alice xác nhận đặt sân
```
Thời gian: 12:00 PM
- Alice vào "Quản lý sân"
- Thấy 1 đặt sân mới
- Click "Xác nhận"
- Trạng thái → 1: Confirmed
```

#### Bước 4: Bob check-in
```
Thời gian: 14:05 (sau khi đến giờ)
- Bob vào "Đặt sân của tôi"
- Click "✓ Check-in"
- Trạng thái → 2: Checked-in
```

#### Bước 5: Hoàn thành và thanh toán
```
Thời gian: 16:05 (sau khi kết thúc)
- Hệ thống tự động hoàn thành
- Tính toán:
  - Fee: 0.2 × 5% = 0.01 ETH (cho platform)
  - Alice nhận: 0.2 - 0.01 = 0.19 ETH
- Trạng thái → 3: Completed
```

#### Bước 6: Rút tiền
```
- Alice rút 0.19 ETH
- Tiền chuyển về ví MetaMask
```

---

## 🐛 Troubleshooting

### ❌ "MetaMask not installed"

**Giải pháp:**
1. Cài đặt MetaMask: https://metamask.io
2. Tạo ví mới hoặc import ví hiện có

### ❌ "Network mismatch"

**Giải pháp:**
1. **Localhost**: Thêm custom network vào MetaMask
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
2. **Sepolia**: Chọn "Sepolia test network" trong MetaMask

### ❌ Insufficient balance

**Localhost:**
```bash
npm.cmd run hardhat-node
# Copy private key từ output
# Import vào MetaMask
# Sẽ có 10,000 ETH test
```

**Sepolia:**
- Lấy testnet ETH từ: https://www.sepoliafaucet.io/

### ❌ Contract address không tìm thấy

**Kiểm tra:**
1. Mở `deployment.json` - tìm contract address
2. Cập nhật `.env` trong `frontend/`
3. Restart React app: `npm.cmd run frontend`

### ❌ Transaction reverted

**Kiểm tra:**
- Ngày/giờ đặt sân có hợp lệ?
- Có xung đột thời gian?
- Số tiền đủ?
- Private key có nhập sai?

### ❌ React app không kết nối

**Giải pháp:**
```bash
# Clear cache
cd frontend
del node_modules
npm.cmd install
npm.cmd start
```

---

## 🎨 Tính Năng Chính

✅ **Tạo sân** - Chủ sân trở thành người bán  
✅ **Tìm sân** - Người dùng tìm sân phù hợp  
✅ **Đặt sân** - Thanh toán bằng Cryptocurrency  
✅ **Xác nhận** - Chủ sân xác nhận đặt sân  
✅ **Check-in** - Người dùng check-in khi đến  
✅ **Hoàn thành** - Thanh toán tự động  
✅ **Hoàn tiền** - Hủy và nhận tiền lại  
✅ **Lợi nhuận** - Rút tiền kiếm được  

---

## 💡 Từ Vị Chuyên Gia

> **Dành cho người không biết Web3:**
> 
> - Tất cả tiền được lưu trữ an toàn trên blockchain
> - Không ai có thể giả mạo hoặc hack được
> - Tất cả giao dịch có thể xem công khai
> - MetaMask là "ví ngân hàng" của bạn trên blockchain

---

## 📚 Tài Liệu Tham Khảo

- **Hardhat**: https://hardhat.org
- **Solidity**: https://solidity-lang.org
- **Ethers.js**: https://docs.ethers.org
- **React**: https://react.dev
- **Sepolia Testnet**: https://sepolia.etherscan.io

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra **Troubleshooting** phía trên
2. Xem **Console errors** trong DevTools (F12)
3. Kiểm tra Hardhat/React logs

---

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập và thương mại

---

**Made with ❤️ for Blockchain Enthusiasts**

*v1.0.0 - April 2026*
