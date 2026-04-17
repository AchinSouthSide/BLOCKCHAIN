# 🚀 FieldBooking DApp - Complete Setup & Running Guide

**Status**: ✅ Ready to Deploy on Hardhat Local Network  
**Requires**: Node.js 18+, MetaMask, Hardhat  
**Cost**: 🆓 FREE (No testnet fees)

---

## 📋 Prerequisites

Before starting, make sure you have:

```bash
# Check Node.js version (need 18.0.0+)
node --version

# Check npm version
npm --version
```

If you don't have Node.js, download it from: https://nodejs.org/

---

## 🎯 QUICK START (5 minutes)

### **Step 1: Install Dependencies**

```bash
cd c:\Users\AChin\Desktop\BlockChain\FieldBooking

# Install root dependencies
npm install

# Install frontend dependencies
npm run install-frontend:win
```

### **Step 2: Start Hardhat Local Node**

Open a new terminal and run:

```bash
npm run node
```

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545

Accounts (test accounts with unlimited ETH):
Account #0: 0x1234... (1000 ETH)
Account #1: 0x5678... (1000 ETH)
...

⚙️ You can now connect to it
```

**⚠️ Important**: Keep this terminal open! The node must run in the background.

### **Step 3: Deploy Smart Contract (New Terminal)**

```bash
npm run deploy:local
```

**Expected output:**
```
🚀 FieldBooking DApp - Deployment Script
==========================================

📝 Accounts:
  Deployer:      0x1234...
  Field Owner 1: 0x5678...
  Field Owner 2: 0x9abc...
  User 1:        0xdef0...
  ...

✅ DEPLOYMENT COMPLETE!
==========================================

✨ Contract Address for .env:
   REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Save the contract address!** You'll need it in the next step.

### **Step 4: Update Frontend Configuration**

1. Open: `frontend/.env`
2. Check if `REACT_APP_CONTRACT_ADDRESS` matches the address from Step 3
3. Should look like:
```env
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_ID=31337
REACT_APP_HARDHAT_RPC=http://127.0.0.1:8545
```

### **Step 5: Start Frontend (New Terminal)**

```bash
npm run frontend:win
```

**Expected output:**
```
Compiled successfully!
Local:   http://localhost:3000
```

### **Step 6: Open in Browser**

Visit: **http://localhost:3000**

**You should see the FieldBooking DApp!**

---

## 🔗 Configure MetaMask (IMPORTANT!)

### Add Hardhat Network to MetaMask

1. Open **MetaMask extension**
2. Click **Networks dropdown** → **Add Network**
3. Fill in:
   - **Network name**: Hardhat Local
   - **New RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency symbol**: ETH
   - **Block explorer**: (leave empty)

4. Click **Save**

### Import Test Accounts to MetaMask

1. Go to Hardhat node terminal (Step 2) and find the private key section
2. Copy any private key (usually starts with `0x...`)
3. In MetaMask:
   - Click account icon → **Import Account**
   - Paste private key
   - Click **Import**

Now you have test accounts with unlimited ETH!

---

## 🧪 Testing the DApp

### **1️⃣ Test as Admin (Create Fields)**

1. **Login**: Click "🔗 Kết nối MetaMask & Đăng Nhập" 
2. Select role: **Chủ Sân (Admin)**
3. Go to **➕ Tạo Sân** tab
4. Fill form:
   - Tên sân: "Sân Bóng Đá Test"
   - Địa chỉ: "Hà Nội"
   - Mô tả: "Test field"
   - Giá: "0.1"
5. Click **✓ TẠO SÂN**
6. Confirm in MetaMask popup
7. Wait for confirmation ✅

### **2️⃣ Test as User (Book Fields)**

1. **Logout**: Click "🚪 Đăng Xuất"
2. **Login again**: Select role: **Người Dùng**
3. Go to **🔍 Duyệt Sân** tab
4. Click on a field
5. Choose start time and end time
6. Click **Đặt Sân**
7. Confirm in MetaMask
8. Wait for confirmation ✅

### **3️⃣ View Bookings**

1. Go to **📅 Booking Của Tôi**
2. See your bookings with status

### **4️⃣ Admin Dashboard**

1. **Logout** and **Login as Admin**
2. Go to **📊 Dashboard** tab
3. See all fields and bookings

---

## 📊 Run Unit Tests

Open browser console (F12) and type:

```javascript
TestRunner.runAll()
```

**Expected output:**
```
✅ ALL TESTS PASSED!
Total: 18/18 passed
Success Rate: 100%
```

---

## 🐛 Troubleshooting

### ❌ Error: "Cannot connect to contract"

**Solution:**
1. Check if Hardhat node is running (Step 2)
2. Check if contract address in `.env` is correct
3. Clear browser cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+Shift+R

### ❌ Error: "MetaMask is not installed"

**Solution:**
1. Install MetaMask: https://metamask.io/
2. Create a wallet if needed
3. Refresh browser

### ❌ Error: "Insufficient gas"

**Solution:**
1. Check account balance in MetaMask
2. Accounts created by `npm run node` have 1000 ETH each
3. Try with a different account

### ❌ Error: "abi is not iterable"

**Solution:**
1. Hard refresh browser: Ctrl+Shift+R
2. Logout and login again
3. Check browser console for errors

### ❌ Contract says "Time slot is already booked"

**Solution:**
1. Choose a different time slot
2. Or wait for the previous booking to complete

---

## 📁 Project Structure

```
FieldBooking/
├── contracts/
│   └── FieldBooking.sol          # Smart Contract (Solidity)
├── scripts/
│   └── deploy.js                 # Deploy script with test data
├── test/
│   └── FieldBooking.test.js      # Unit tests
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── WalletSelector.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── UserDashboard.js
│   │   │   ├── FieldList.js
│   │   │   ├── CreateField.js
│   │   │   ├── BookingList.js
│   │   │   └── ... (8 total)
│   │   ├── services/
│   │   │   ├── ContractService.js
│   │   │   ├── AuthService.js
│   │   │   ├── NetworkConfig.js
│   │   │   └── abi/
│   │   └── styles/               # CSS files
│   ├── public/
│   └── package.json
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Root dependencies
└── .env.example                  # Environment template
```

---

## 🔑 Key Files Explained

### **Smart Contract** (`contracts/FieldBooking.sol`)
- 11+ functions for field management and bookings
- Full event logging
- Payment handling with automatic refunds
- Time conflict detection

### **Deployment Script** (`scripts/deploy.js`)
- Auto-deploys contract
- Creates test fields
- Creates test bookings
- Saves deployment info to `deployment.json`

### **Frontend Services** (`frontend/src/services/`)
- `ContractService.js` - All blockchain interactions
- `AuthService.js` - User authentication
- `NetworkConfig.js` - Network configuration (defaults to Hardhat)

### **Environment** (`.env`)
- `REACT_APP_CONTRACT_ADDRESS` - Contract address from deployment
- `REACT_APP_NETWORK_ID` - Chain ID (31337 = Hardhat Local)
- `REACT_APP_HARDHAT_RPC` - RPC endpoint

---

## 🎮 Available Commands

```bash
# Development
npm run node                      # Start Hardhat node
npm run deploy:local             # Deploy contract with test data
npm run frontend:win             # Start React dev server
npm run test                     # Run unit tests
npm run compile                  # Compile contracts

# Cleanup
npm run hardhat clean            # Clean artifacts

# Optional: Sepolia Testnet (requires test ETH)
npm run deploy:sepolia           # Deploy to Sepolia
npm run validate:sepolia         # Validate on Sepolia
```

---

## 📝 Smart Contract Functions

### Admin Functions
- `createField()` - Create a new sports field
- `updateField()` - Update field details
- `toggleFieldStatus()` - Enable/disable field
- `confirmBooking()` - Confirm user booking
- `withdraw()` - Withdraw earnings

### User Functions
- `createBooking()` - Book a field (send ETH)
- `checkIn()` - Check-in for booking
- `cancelBooking()` - Cancel pending booking
- `getUserBookings()` - Get my bookings

### View Functions (Read-only)
- `getFields()` - Get all fields
- `getField()` - Get specific field
- `getBooking()` - Get booking details
- `hasTimeConflict()` - Check time availability

---

## 💡 Tips & Best Practices

### For Development
- Always keep Hardhat node running (separate terminal)
- Use Account #0 for admin/field owner
- Use Account #1, #2, etc. for regular users
- Each account has unlimited ETH - no need to fund

### For Testing
- Start with admin: create a field
- Switch to user: book the field
- Check admin dashboard: see bookings
- Run unit tests to verify everything

### For Debugging
- Check browser console (F12) for errors
- Check Hardhat node terminal for transaction logs
- Check MetaMask popup for transaction status
- Use TestRunner.runAll() to validate contract ABI

---

## 🚀 Next Steps

1. ✅ Follow the QUICK START above
2. ✅ Test all admin and user functions
3. ✅ Run unit tests
4. ✅ Check console for any errors
5. ✅ Add your own test data

---

## 📞 Need Help?

Check the browser console (F12 → Console tab) for detailed logs. Most errors will be logged there with a description and solution.

**Common issues are resolved by:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear cache (Ctrl+Shift+Delete)
3. Restart browser and hardhat node
4. Import accounts again in MetaMask

---

**Happy Coding! 🎉**
