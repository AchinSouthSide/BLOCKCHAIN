# 🏟️ FieldBooking - Blockchain-based Field Booking System

**Hệ thống đặt sân thể thao trên blockchain với Smart Contract, React Frontend và MetaMask integration**

> ✅ **100% Hoàn Thành** - Chạy hoàn toàn trên Hardhat Local Network (KHÔNG CÓ PHÍ)

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install && npm run install-frontend:win

# 2. Start Hardhat node (Terminal 1)
npm run node

# 3. Deploy contract (Terminal 2)
npm run deploy:local

# 4. Start frontend (Terminal 3)
npm run frontend:win

# 5. Open browser
# http://localhost:3000
```

**👉 [Full Setup Guide](./SETUP_GUIDE.md)** - Detailed instructions with screenshots

---

## ✨ Features

### 🔐 Admin Panel
- ✅ Create sports fields (name, location, price, hours)
- ✅ Update field information
- ✅ Manage all bookings
- ✅ View total revenue in ETH
- ✅ Withdraw earnings

### 🏃 User Dashboard
- ✅ Connect MetaMask wallet
- ✅ Browse all available fields
- ✅ Book field (send ETH transaction)
- ✅ View booking history
- ✅ Cancel pending bookings
- ✅ Check-in/Check-out

### 🛡️ Smart Features
- ✅ No time slot conflicts (automatic detection)
- ✅ Automatic price calculation
- ✅ Automatic refund for overpayment
- ✅ Event logging for all transactions
- ✅ Full payment tracking

---

## 🏗️ Architecture

### **Smart Contract (Solidity)**
```solidity
- 11+ functions
- 9 events  
- Full security checks
- Gas optimized
```

### **Frontend (React)**
```javascript
- 8 components
- ethers.js v6
- MetaMask integration
- Real-time updates
```

### **Backend (Hardhat)**
```bash
- Local network (ChainID: 31337)
- Automatic deployment
- Test data generation
- Zero configuration needed
```

---

## 📁 Project Structure

```
FieldBooking/
├── contracts/
│   └── FieldBooking.sol              # Smart Contract
├── scripts/
│   └── deploy.js                     # Deploy + Test Data
├── test/
│   └── FieldBooking.test.js          # 18 Unit Tests (100% pass)
├── frontend/
│   ├── src/
│   │   ├── components/               # 8 React Components
│   │   ├── services/
│   │   │   ├── ContractService.js
│   │   │   ├── AuthService.js
│   │   │   └── NetworkConfig.js
│   │   └── styles/
│   ├── public/
│   └── package.json
├── hardhat.config.js                 # Hardhat Config
├── package.json
├── SETUP_GUIDE.md                    # 👈 Detailed Setup
└── .env.example
```

---

## 💻 System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **MetaMask**: Browser extension
- **RAM**: 2GB minimum
- **Storage**: 500MB
- **OS**: Windows / Mac / Linux

---

## 🔗 Network Configuration

### Default: Hardhat Local (Recommended)
```javascript
Chain ID: 31337
RPC: http://127.0.0.1:8545
Type: Local (FREE - No fees)
Gas: Instant
Accounts: 20 test accounts with 1000 ETH each
```

### Optional: Sepolia Testnet
- Chain ID: 11155111
- Requires free test ETH from faucet
- Network fee: ~0.001 ETH per transaction

### Optional: Ethereum Mainnet
- ⚠️ Not recommended for testing
- Requires real ETH

---

## 📊 Smart Contract Functions

### Field Management
```solidity
createField(name, location, description, pricePerHour)
updateField(fieldId, ...)
toggleFieldStatus(fieldId)
getField(fieldId) → Field
getFields() → Field[]
```

### Booking Management
```solidity
createBooking(fieldId, startTime, endTime) payable
confirmBooking(bookingId)
checkIn(bookingId)
completeBooking(bookingId)
cancelBooking(bookingId)
refundBooking(bookingId)
getUserBookings(userAddress) → Booking[]
getBooking(bookingId) → Booking
hasTimeConflict(fieldId, start, end) → bool
```

### Payment Management
```solidity
withdraw()
withdrawPlatformFee()
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
# Output: 18/18 tests passed ✅
```

### Manual Testing (Browser Console)
```javascript
// Run all tests
TestRunner.runAll()

// Output: 18 tests passed, 100% success rate
```

---

## 📱 Frontend Components

1. **WalletSelector** - Auto-detect and connect accounts
2. **AdminDashboard** - Admin control panel
3. **UserDashboard** - User portal
4. **FieldList** - Browse all fields
5. **CreateField** - Create new field (admin only)
6. **BookingList** - My bookings
7. **Balance** - View earnings
8. **NetworkSwitcher** - Switch networks

---

## 🔑 Key Features Explained

### ✅ No Test ETH Needed
- Hardhat local network provides unlimited ETH
- All test accounts start with 1000 ETH
- Transactions are instant (no waiting for blocks)

### ✅ Automatic Time Conflict Detection
- Smart contract checks booking times
- Prevents double-booking
- Returns error if time slot taken

### ✅ Automatic Refund System
- If user overpays, excess ETH is returned
- If booking cancelled, full refund sent
- All refunds are automatic

### ✅ Complete Event Logging
- Every action emits an event
- Full audit trail
- All events indexed

### ✅ Responsive Design
- Works on desktop, tablet, mobile
- Purple gradient theme
- Status color coding

---

## 📋 Usage Workflow

### 1. Admin Creates Field
```
Login as Admin
→ Create Field Tab
→ Fill form (name, price, etc.)
→ Click "Tạo Sân"
→ Confirm in MetaMask
→ Field appears in list
```

### 2. User Books Field
```
Login as User
→ Browse Fields
→ Select field
→ Choose time slot
→ Click "Đặt Sân"
→ Send ETH transaction
→ Booking confirmed
```

### 3. Admin Sees Revenue
```
Switch to Admin
→ Balance tab
→ View total earnings
→ View platform fees
→ Click "Rút Tiền" to withdraw
```

### 4. User Sees Bookings
```
Switch to User
→ My Bookings tab
→ See all bookings
→ View status
→ Can cancel if pending
```

---

## ⚙️ Configuration Files

### `hardhat.config.js`
- Solidity version: 0.8.20
- Gas optimization enabled
- 20 test accounts configured

### `frontend/.env`
```env
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_ID=31337
REACT_APP_HARDHAT_RPC=http://127.0.0.1:8545
```

### `.env.example`
- Template for environment variables
- Fill this out for testnet deployment

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect | Check Hardhat node is running |
| Wrong network | Switch to Hardhat Local in MetaMask |
| "abi is not iterable" | Hard refresh (Ctrl+Shift+R) |
| MetaMask not found | Install MetaMask extension |
| Insufficient balance | Use different account with ETH |
| Time slot booked | Choose different time |

👉 **[Full Troubleshooting Guide](./SETUP_GUIDE.md#-troubleshooting)**

---

## 📊 Deployment Info

After running `npm run deploy:local`, check `deployment.json`:

```json
{
  "network": "localhost",
  "chainId": 31337,
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "deployedAt": "2026-04-17T...",
  "accounts": {
    "deployer": "0x1234...",
    "fieldOwner1": "0x5678...",
    "user1": "0x9abc..."
  },
  "testData": {
    "fields": 3,
    "bookings": 1,
    "pricePerHour": "0.1 ETH"
  }
}
```

---

## 🔄 Workflow Diagrams

### User Flow
```
User → Login → Browse Fields → Select Field → Book → Confirm → Booking Created
                ↓
         MetaMask Connected
                ↓
         Transaction Signed
```

### Admin Flow
```
Admin → Create Field → View Fields → See Bookings → Withdraw → Revenue
          ↓
       Transaction Sent
          ↓
       Contract Updates
```

### Smart Contract Flow
```
User sends transaction
    ↓
Contract checks: price, time, conflict
    ↓
If valid: create booking, handle payment
    ↓
If invalid: revert with error message
    ↓
Emit event for logging
```

---

## 📈 Scalability

Current implementation handles:
- ✅ Multiple fields (unlimited)
- ✅ Multiple users (unlimited)
- ✅ Multiple bookings (unlimited)
- ✅ Concurrent bookings (different time slots)
- ✅ Payment processing
- ✅ Revenue tracking

---

## 🚀 Deployment Steps

### Local (Recommended)
```bash
npm run node              # Terminal 1
npm run deploy:local      # Terminal 2
npm run frontend:win      # Terminal 3
```

### Sepolia Testnet
```bash
# Setup in .env
SEPOLIA_RPC_URL=https://...
PRIVATE_KEY=0x...

# Deploy
npm run deploy:sepolia
```

---

## 📚 Learning Resources

- [Hardhat Documentation](https://hardhat.org/)
- [Solidity by Example](https://solidity-by-example.org/)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

## 📝 License

MIT License - Feel free to use this code

---

## ✅ Verification Checklist

- [x] Smart contract fully functional
- [x] 18/18 unit tests passing
- [x] Frontend components working
- [x] MetaMask integration complete
- [x] Hardhat local network configured
- [x] Deployment script automated
- [x] Test data generation included
- [x] Error handling implemented
- [x] Event logging complete
- [x] Documentation comprehensive

---

**Ready to use! 🎉 See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.**

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
