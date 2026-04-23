# 🚀 START HERE - FieldBooking Quick Launch Guide

**Read This First!** Complete setup in 5 minutes.

---

## ⚡ Cách chạy nhanh (1 máy, không Azure) — Khuyên dùng

### Option 1 (DEV nhanh nhất): 1 lệnh chạy tất cả
```powershell
powershell -ExecutionPolicy Bypass -File .\RUN_LOCAL_DEV.ps1
```

Mở app tại: **http://localhost:3000**

### Option 2 (giống production hơn): build + server
```powershell
powershell -ExecutionPolicy Bypass -File .\RUN_LOCAL.ps1
```

Mở app tại: **http://localhost:3001**

---

## 📋 One-Time Setup (First Time Only)

### Step 1: Navigate to Project
```bash
cd c:\Users\AChin\Desktop\BlockChain\FieldBooking
```

### Step 2: Install Everything
```bash
npm install
npm run install-frontend:win
```

**Wait 2-3 minutes...**

---

## ▶️ Running the DApp (Every Time)

### ✅ Terminal 1: Start Hardhat Node
```bash
npm run node
```

**Expected**: Shows "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545"

**⚠️ Keep this running!**

### ✅ Terminal 2: Deploy Smart Contract
```bash
npm run deploy:local
```

**Expected**: 
```
✅ DEPLOYMENT COMPLETE!
✨ Contract Address for .env:
   REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Note**: Copy the contract address (you might need it)

### ✅ Terminal 3: Start Frontend
```bash
npm run frontend:win
```

**Expected**: 
```
Compiled successfully!
Local: http://localhost:3000
```

### ✅ Step 4: Open Browser
Visit: **http://localhost:3000**

---

## 🔗 MetaMask Setup (Do This Once)

1. Open **MetaMask Extension**
2. Click **Networks Dropdown**
3. Click **Add Network**
4. Fill in:
   - **Network name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency**: ETH
5. Click **Save**

---

## 🧪 Test the DApp

### Option A: Quick Test (5 minutes)
1. **Login** as Admin
2. **Create** 1 field
3. **Logout** and login as User
4. **Book** the field
5. ✅ Done!

### Multi-user trên 1 máy (không cần máy khác)
- Cách 1: Import nhiều account Hardhat vào MetaMask và đổi account khi test
- Cách 2: Dùng 2 Chrome/Edge profile (mỗi profile có MetaMask riêng) để mở 2 phiên song song

### Option B: Full Test (15 minutes)
Follow the 7 scenarios in [TESTING_GUIDE.md](./TESTING_GUIDE.md)

### Option C: Run Unit Tests
1. Press F12 (Browser Console)
2. Type: `TestRunner.runAll()`
3. See 18 tests pass ✅

---

## 📁 What Each File Does

| File | Purpose |
|------|---------|
| `npm run node` | Start blockchain (keep running) |
| `npm run deploy:local` | Deploy contract + create test data |
| `npm run frontend:win` | Start React app |
| `http://localhost:3000` | Open DApp in browser |

---

## ⚠️ Important

### If Something Goes Wrong

**Error: Cannot connect to contract**
- Make sure Terminal 1 (Hardhat node) is still running

**Error: Wrong Network**
- Switch to "Hardhat Local" in MetaMask

**Error: "abi is not iterable"**
- Hard refresh: Ctrl+Shift+R

**Error: Insufficient funds**
- Use a different MetaMask account (from Hardhat node)

---

## ✨ Features Available

### Admin
- ✅ Create fields
- ✅ View all bookings  
- ✅ Confirm bookings
- ✅ View revenue

### User  
- ✅ Browse fields
- ✅ Book fields
- ✅ View my bookings
- ✅ Cancel bookings

---

## 📚 More Info

- **Full Setup Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Testing Scenarios**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)  
- **Complete Report**: [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)
- **Project Overview**: [README.md](./README.md)

---

## 🎉 You're All Set!

**Next**: Open 3 terminals and follow the steps above.

**Questions?** Check the troubleshooting section in [SETUP_GUIDE.md](./SETUP_GUIDE.md)
