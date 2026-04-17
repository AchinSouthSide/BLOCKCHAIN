# 🗺️ FieldBooking - System Architecture & Flow Diagram

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIELDBOOKING DAPP ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────┘

                         🌐 INTERNET
                              ↓
                    ┌─────────────────────┐
                    │   BROWSER (React)   │
                    │   localhost:3000    │
                    └─────────────────────┘
                              ↓
              ┌───────────────────────────────────┐
              │   FRONTEND SERVICES               │
              ├───────────────────────────────────┤
              │ • ContractService.js (18+ methods)│
              │ • AuthService.js (user mgmt)      │
              │ • NetworkConfig.js (net mgmt)     │
              └───────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   ethers.js v6      │
                    │ (Blockchain RPC)    │
                    └─────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              HARDHAT LOCAL NETWORK (ChainID: 31337)              │
├─────────────────────────────────────────────────────────────────┤
│  • RPC: http://127.0.0.1:8545                                  │
│  • Accounts: 20 test accounts (1000 ETH each)                  │
│  • Instant blocks & transactions                               │
│  • No fees (FREE!)                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │ SMART CONTRACT      │
                    │  FieldBooking.sol   │
                    └─────────────────────┘
                              ↓
              ┌───────────────────────────────────┐
              │   CONTRACT STATE                  │
              ├───────────────────────────────────┤
              │ • Fields Mapping                  │
              │ • Bookings Mapping                │
              │ • User Bookings Mapping           │
              │ • Earnings Tracking               │
              │ • Event Logs                      │
              └───────────────────────────────────┘

```

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    USER INTERACTION FLOW                      │
└──────────────────────────────────────────────────────────────┘

ADMIN FLOW:
═══════════

Login (MetaMask)
    ↓
[Admin Dashboard]
    ├─→ Create Field → Pay Gas Fee → Field Created ✅
    ├─→ View Bookings → See all bookings
    ├─→ Confirm Booking → Approve → Status: Confirmed ✅
    └─→ View Revenue → Withdraw → ETH to Wallet ✅


USER FLOW:
═════════

Login (MetaMask)
    ↓
[User Dashboard]
    ├─→ Browse Fields → See Field List
    │       ↓
    │   Select Field → Choose Time Slot → See Price
    │       ↓
    │   Send ETH → MetaMask Popup → Confirm
    │       ↓
    │   Transaction Sent → Waiting... → Confirmed ✅
    │       ↓
    │   Booking Created (Status: Pending)
    │
    ├─→ My Bookings
    │       ├─ Status: Pending → Can Cancel
    │       ├─ Status: Confirmed → Can Check-in
    │       ├─ Status: Checked-in → Can Complete
    │       └─ Status: Completed → View Details
    │
    └─→ Booking History → See all past bookings

```

---

## 🔄 Transaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│              HOW A BOOKING TRANSACTION WORKS                  │
└─────────────────────────────────────────────────────────────┘

1. USER CLICKS "ĐẶT SÂN" (BOOK FIELD)
   ↓
2. FRONTEND CALCULATES PRICE
   ├─ Hours: End Time - Start Time
   └─ Price: Hours × Price Per Hour
   ↓
3. METAMASK POPUP APPEARS
   ├─ Shows amount in ETH
   ├─ Shows gas fee
   └─ User clicks "Confirm"
   ↓
4. TRANSACTION SENT TO HARDHAT
   ├─ User Address: 0x1234...
   ├─ Amount: 0.2 ETH
   └─ Method: createBooking()
   ↓
5. SMART CONTRACT VALIDATES
   ├─ Is field active? ✅
   ├─ Is time valid? ✅
   ├─ No conflicts? ✅
   ├─ Amount >= price? ✅
   └─ All checks pass → Execute ✅
   ↓
6. CONTRACT UPDATES STATE
   ├─ Add to bookings mapping
   ├─ Add to user bookings list
   ├─ Track field bookings
   └─ Handle refund if overpaid
   ↓
7. EVENT EMITTED
   └─ BookingCreated(bookingId, fieldId, user, startTime, endTime)
   ↓
8. FRONTEND UPDATES UI
   ├─ Show success message
   ├─ Redirect to "My Bookings"
   └─ Display new booking
   ↓
9. COMPLETE ✅
   └─ Booking is now in pending status

```

---

## 📁 File Structure (Detailed)

```
FieldBooking/
│
├─ contracts/
│  └─ FieldBooking.sol (400+ lines)
│     ├─ Structs: Field, Booking
│     ├─ State: fields, bookings, earnings
│     ├─ Functions: 11+ core functions
│     ├─ Events: 9 events
│     └─ Modifiers: 4 modifiers
│
├─ scripts/
│  └─ deploy.js (100+ lines)
│     ├─ Deploy contract
│     ├─ Create 3 test fields
│     ├─ Create 1 test booking
│     ├─ Save deployment.json
│     └─ Show instructions
│
├─ test/
│  └─ FieldBooking.test.js (18 tests)
│     ├─ Field creation tests (4)
│     ├─ Field update tests (3)
│     ├─ Booking tests (5)
│     ├─ Payment tests (3)
│     └─ Owner operation tests (3)
│
├─ frontend/
│  ├─ public/
│  │  ├─ index.html
│  │  └─ metamask-test.html
│  │
│  ├─ src/
│  │  ├─ components/ (8 files)
│  │  │  ├─ AdminDashboard.js
│  │  │  ├─ UserDashboard.js
│  │  │  ├─ WalletSelector.js
│  │  │  ├─ FieldList.js
│  │  │  ├─ CreateField.js
│  │  │  ├─ BookingList.js
│  │  │  ├─ Balance.js
│  │  │  └─ Navbar.js
│  │  │
│  │  ├─ services/
│  │  │  ├─ ContractService.js (18+ methods)
│  │  │  ├─ AuthService.js (user mgmt)
│  │  │  ├─ NetworkConfig.js (network mgmt)
│  │  │  └─ abi/
│  │  │     ├─ FieldBooking.json (ABI)
│  │  │     └─ index.js (ABI loader)
│  │  │
│  │  ├─ styles/ (9 CSS files)
│  │  │  ├─ AdminDashboard.css
│  │  │  ├─ UserDashboard.css
│  │  │  ├─ BookingList.css
│  │  │  ├─ FieldList.css
│  │  │  ├─ CreateField.css
│  │  │  ├─ Balance.css
│  │  │  ├─ Navbar.css
│  │  │  ├─ WalletSelector.css
│  │  │  └─ NetworkSwitcher.css
│  │  │
│  │  ├─ tests/
│  │  │  ├─ UnitTests.js (13 tests)
│  │  │  └─ TestSuite.js
│  │  │
│  │  ├─ utils/
│  │  │  ├─ EnsureHardhatNetwork.js
│  │  │  └─ NetworkSetup.js
│  │  │
│  │  ├─ App.js (main component)
│  │  └─ index.js (entry point)
│  │
│  ├─ .env (configuration)
│  └─ package.json
│
├─ hardhat.config.js
├─ package.json
├─ .env.example
├─ deployment.json (created after deploy)
│
└─ DOCUMENTATION (NEW)
   ├─ START_HERE.md ⭐ (Read this first!)
   ├─ SETUP_GUIDE.md (Detailed setup)
   ├─ TESTING_GUIDE.md (7 test scenarios)
   ├─ QUICK_REFERENCE.md (Quick reference)
   ├─ DELIVERY_CHECKLIST.md (Verification)
   ├─ COMPLETION_REPORT.md (Summary)
   └─ README.md (Project overview)
```

---

## 🔌 Component Dependencies

```
App.js (Main)
├─ Login
├─ Navbar
├─ NetworkSwitcher
└─ Conditional Rendering
   ├─ Not Logged In
   │  └─ WalletSelector (auto-loads accounts)
   │
   ├─ Logged In as Admin
   │  ├─ AdminDashboard
   │  │  ├─ CreateField
   │  │  ├─ BookingManagement
   │  │  └─ Balance
   │  └─ FieldList (read-only)
   │
   └─ Logged In as User
      ├─ UserDashboard
      │  ├─ FieldList (can book)
      │  └─ BookingList
      └─ Balance (read-only)

Services (Shared)
├─ ContractService
│  ├─ Communicates with smart contract
│  └─ All blockchain interactions
│
├─ AuthService
│  ├─ User authentication
│  └─ Session management
│
└─ NetworkConfig
   ├─ Network management
   └─ Defaults to Hardhat Local
```

---

## ⚙️ Configuration Hierarchy

```
Application Settings
│
├─ Environment Level (.env file)
│  ├─ REACT_APP_CONTRACT_ADDRESS
│  ├─ REACT_APP_NETWORK_ID
│  └─ REACT_APP_HARDHAT_RPC
│
├─ Network Level (NetworkConfig.js)
│  ├─ Available networks (31337, 11155111, 1)
│  ├─ RPC endpoints
│  ├─ Explorer URLs
│  └─ Defaults to Hardhat Local (31337)
│
├─ Hardhat Level (hardhat.config.js)
│  ├─ Solidity version: 0.8.20
│  ├─ Networks: localhost, hardhat, sepolia
│  ├─ Accounts: 20 test accounts
│  ├─ Gas optimization: enabled
│  └─ ChainID: 31337 (Hardhat)
│
└─ Smart Contract Level (FieldBooking.sol)
   ├─ Platform owner: deployer
   ├─ Platform fee: 5%
   ├─ Field counter: 0 (increments)
   ├─ Booking counter: 0 (increments)
   └─ Mappings: fields, bookings, earnings
```

---

## 🔐 Security Layers

```
User Interaction
│
├─ MetaMask (Layer 1: Wallet Security)
│  └─ User signs all transactions
│  └─ Private key never exposed
│
├─ ethers.js (Layer 2: RPC Communication)
│  └─ Secure connection to Hardhat
│  └─ ABI validation
│
├─ Smart Contract (Layer 3: Logic Validation)
│  ├─ Modifiers (onlyOwner, onlyFieldOwner)
│  ├─ Require statements (validation)
│  ├─ Time checks (no past bookings)
│  └─ Payment verification
│
└─ Local Network (Layer 4: Execution)
   └─ Instant blocks
   └─ Gas simulation
   └─ State updates
```

---

## 📈 Scaling Considerations

```
Current Implementation:
├─ Handles unlimited fields
├─ Handles unlimited bookings
├─ Handles unlimited users
└─ Efficient time conflict detection

Possible Optimizations:
├─ Pagination for large lists
├─ Caching for read-heavy operations
├─ Batch transactions
├─ Off-chain indexing (The Graph)
└─ Layer 2 scaling (Arbitrum, Polygon)
```

---

## 🎯 Key Design Patterns Used

```
1. Access Control (Solidity)
   └─ Modifiers: onlyOwner, onlyFieldOwner
   └─ Ensures only authorized users can perform actions

2. State Management (React)
   └─ useState hooks for UI state
   └─ useEffect hooks for side effects
   └─ localStorage for session persistence

3. Service Pattern (Frontend)
   └─ Separation of concerns
   └─ ContractService, AuthService, NetworkConfig
   └─ Easy to test and maintain

4. Event Logging (Smart Contract)
   └─ All important state changes emit events
   └─ Enables off-chain indexing
   └─ Better UX with notifications

5. Template Method (Deployment)
   └─ Deploy script creates test data
   └─ Automated setup
   └─ Faster testing
```

---

## 🚀 Deployment Pipeline

```
Development (Local)
│
├─ npm run node
│  └─ Start Hardhat local network
│
├─ npm run deploy:local
│  └─ Deploy to local (ChainID: 31337)
│
└─ npm run frontend:win
   └─ Start React dev server

Testing (Sepolia Testnet)
│
├─ Setup .env with SEPOLIA_RPC_URL
│
└─ npm run deploy:sepolia
   └─ Deploy to Sepolia (ChainID: 11155111)

Production (Ethereum Mainnet)
│
├─ ⚠️ Not recommended for DApp testing
│
└─ Requires real ETH and security audit
```

---

**Use this diagram as reference while working on the project! 📌**
