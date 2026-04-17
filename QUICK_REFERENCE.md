# 🔖 FieldBooking - Quick Reference Card

**Print this or keep it open while working!**

---

## 🚀 Main Commands

```bash
# Install once
npm install && npm run install-frontend:win

# Run these 3 in separate terminals (every time)
npm run node              # Terminal 1: Hardhat node
npm run deploy:local      # Terminal 2: Deploy contract
npm run frontend:win      # Terminal 3: Frontend

# Testing
npm run test             # Run 18 unit tests
```

---

## 📱 Browser URLs

| Purpose | URL |
|---------|-----|
| DApp | http://localhost:3000 |
| Console Tests | F12 → Console → `TestRunner.runAll()` |

---

## 🔑 MetaMask Setup (One-Time)

**Network Details:**
- Name: Hardhat Local
- RPC: http://127.0.0.1:8545
- Chain ID: 31337
- Currency: ETH

---

## 👥 Test Accounts

| Account | Role | Balance |
|---------|------|---------|
| #0 | Admin/Owner | 1000 ETH |
| #1 | User | 1000 ETH |
| #2 | User | 1000 ETH |
| ... | ... | 1000 ETH |

**All accounts have unlimited ETH!**

---

## 🆔 Contract Address

**After deployment**, check `deployment.json`:
```json
{
  "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "accounts": {...},
  "testData": {...}
}
```

---

## ⚡ Quick Actions

### Create Field (Admin)
```
1. Login as Admin
2. Click "➕ Tạo Sân"
3. Fill form (name, price, etc.)
4. Click "✓ TẠO SÂN"
5. Confirm in MetaMask
```

### Book Field (User)
```
1. Login as User
2. Click "🔍 Duyệt Sân"
3. Select field
4. Choose time
5. Click "Đặt Sân"
6. Confirm in MetaMask
```

### View Revenue (Admin)
```
1. Click "💰 Balance"
2. See earnings
3. Click "Rút Tiền" to withdraw
```

---

## 🐛 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| Cannot connect | Keep Hardhat node running (Terminal 1) |
| Wrong network | Switch to "Hardhat Local" in MetaMask |
| abi not iterable | Hard refresh: Ctrl+Shift+R |
| No accounts | Import account from Hardhat (show private key) |
| Time slot booked | Choose different time slot |
| Insufficient balance | Use different test account |
| Transaction pending | Wait 10-15 seconds for Hardhat |

---

## 🔄 Reset Browser

```bash
# Clear everything and restart
1. Ctrl+Shift+Delete (clear cache)
2. Ctrl+Shift+R (hard refresh)
3. F12 → Application → Clear All
4. Logout in app
5. Re-login
```

---

## 📊 Admin Functions

```
Dashboard Tab:
- View all fields
- View all bookings
- Confirm pending bookings
- See booking status

Create Field Tab:
- Form to create new field
- Set price per hour
- Add description

Balance Tab:
- View earnings
- See platform fees
- Withdraw money
```

---

## 📱 User Functions

```
Browse Fields Tab:
- See all available fields
- Click to book field
- See field details

My Bookings Tab:
- View all your bookings
- Check status
- Cancel if pending

Booking Actions:
- Pending → Cancel
- Confirmed → Check-in
- Checked-in → Complete
```

---

## 🧪 Testing Quick Test

```javascript
// In browser console (F12)

// Run all unit tests
TestRunner.runAll()

// Expected: 18/18 passed ✅
```

---

## 📋 Files to Know

| File | Purpose | Edit? |
|------|---------|-------|
| frontend/.env | Configuration | ✅ If needed |
| hardhat.config.js | Network setup | ❌ Usually not |
| scripts/deploy.js | Deploy script | ❌ Don't edit |
| contracts/FieldBooking.sol | Smart contract | ⚠️ Advanced |

---

## 💾 Important Folders

| Folder | Contains |
|--------|----------|
| `contracts/` | Smart Contract (Solidity) |
| `scripts/` | Deployment script |
| `frontend/src/components/` | React components |
| `frontend/src/services/` | Contract interactions |
| `test/` | Unit tests |

---

## 🔐 Security Reminders

- ✅ Never share private keys
- ✅ Keep Hardhat node secure (local only)
- ✅ Don't commit .env to git
- ✅ Only use Hardhat for local testing
- ✅ Use testnet for real testing (Sepolia)
- ✅ Use mainnet for production (not recommended for DApp testing)

---

## 📈 Performance Tips

- Keep 3 terminals open (node, deploy, frontend)
- Use Account #0 for admin/owner
- Use Account #1+ for users
- Wait 5-10 seconds between transactions
- Hard refresh if UI doesn't update
- Check console for errors (F12)

---

## 🎯 Workflow

```
1. Open 3 Terminals
   └─ Terminal 1: npm run node
   └─ Terminal 2: npm run deploy:local
   └─ Terminal 3: npm run frontend:win

2. Open Browser
   └─ http://localhost:3000

3. Setup MetaMask
   └─ Add Hardhat Local network
   └─ Import test account

4. Test Features
   └─ Create field (admin)
   └─ Book field (user)
   └─ View bookings
   └─ Withdraw earnings

5. Run Tests
   └─ F12 → Console
   └─ TestRunner.runAll()
   └─ See 18 tests pass ✅
```

---

## 📚 Documentation Links

- **Quick Start**: [START_HERE.md](./START_HERE.md)
- **Full Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Testing**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Project Info**: [README.md](./README.md)
- **Checklist**: [DELIVERY_CHECKLIST.md](./DELIVERY_CHECKLIST.md)

---

## 🆘 Emergency Reset

If everything breaks:

```bash
# Stop everything (Ctrl+C in terminals)

# Clean cache
npm run hardhat clean

# Reinstall
npm install

# Restart
npm run node          # Terminal 1
npm run deploy:local  # Terminal 2
npm run frontend:win  # Terminal 3
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Hardhat node running (Terminal 1)
- [ ] Contract deployed (got address)
- [ ] Frontend loaded (http://localhost:3000)
- [ ] MetaMask connected to Hardhat Local
- [ ] Can see test accounts in MetaMask
- [ ] Can create field as admin
- [ ] Can book field as user
- [ ] Tests pass (TestRunner.runAll())

---

**Print or bookmark this page!** 📌
