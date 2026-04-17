# 🧪 Testing & Demo Guide - FieldBooking DApp

**Complete walkthrough of all features with step-by-step instructions**

---

## ✅ Scenario 1: Admin Creates a Field

### Setup
- Hardhat node running
- Contract deployed
- Frontend open at http://localhost:3000
- MetaMask installed with Hardhat network

### Steps

**1. Login as Admin**
```
1. Click "🔗 Kết nối MetaMask & Đăng Nhập"
2. Select role: "Chủ Sân (Admin)"
3. Approve in MetaMask popup
4. Wait for redirect to dashboard
```

**2. Navigate to Create Field**
```
1. In top navigation, click "➕ Tạo Sân"
2. You should see a form
```

**3. Fill Field Form**
```
Form fields:
- Tên sân: "Sân Bóng Đá A"
- Địa chỉ: "123 Đường ABC, Hà Nội"
- Mô tả: "Sân bóng 5 người, cỏ nhân tạo"
- Giá (ETH/hour): "0.1"
```

**4. Submit**
```
1. Click "✓ TẠO SÂN"
2. MetaMask popup appears
3. Click "Confirm" in MetaMask
4. Wait 10-15 seconds for transaction
5. Success message appears: "✅ Sân đã tạo thành công!"
```

**5. Verify in Dashboard**
```
1. Click "📊 Dashboard" or "🔍 Browse Fields"
2. You should see the field in the list
3. Field shows: Name, Price, Location, Owner
```

### Expected Output
✅ Field appears in list  
✅ Field owner is your address  
✅ Price is 0.1 ETH/hour  
✅ Status is "Active"

---

## ✅ Scenario 2: User Books a Field

### Setup
- At least one field created (from Scenario 1)
- Frontend still open
- MetaMask still connected

### Steps

**1. Logout & Switch to User**
```
1. Click "🚪 Đăng Xuất"
2. Browser redirects to login
3. Click "🔗 Kết nối MetaMask & Đăng Nhập"
4. Select role: "Người Dùng"
5. Approve in MetaMask
6. Wait for redirect
```

**2. Navigate to Browse Fields**
```
1. Click "🔍 Duyệt Sân"
2. You should see the field(s) you created
```

**3. Click on a Field**
```
1. Click on the field card
2. Modal popup appears with:
   - Field name, location, description
   - Price per hour
   - Start time and End time selectors
   - "Đặt Sân" button
```

**4. Select Time Slot**
```
1. Click "Select Start Time"
2. Choose a date in the future
3. Choose a time (must be at least 1 hour away)
4. Click "Select End Time"  
5. Choose end time (must be after start time)
6. Can't select more than 24 hours in the future
```

**5. Book the Field**
```
1. Click "Đặt Sân"
2. Page shows: "Loading... Vui lòng chờ xác nhận"
3. MetaMask popup appears showing:
   - Transaction details
   - Gas fee (usually very small)
   - Amount in ETH
4. Click "Confirm" in MetaMask
5. Wait for confirmation
```

**6. Booking Confirmed**
```
Success message appears:
"✅ Đặt sân thành công!"

Modal closes
Redirects to "📅 Booking Của Tôi"
Your booking appears in the list with status "Pending"
```

### Expected Output
✅ Booking appears in my bookings list  
✅ Status shows "Pending" (yellow badge)  
✅ Shows correct field name and time  
✅ Shows total price (e.g., "0.2 ETH for 2 hours")  
✅ MetaMask shows successful transaction

---

## ✅ Scenario 3: Admin Confirms Booking

### Setup
- Booking created (from Scenario 2)
- Currently viewing as Admin
- Navigate to Admin Dashboard

### Steps

**1. Go to Admin Dashboard**
```
1. Logout (click "🚪 Đăng Xuất")
2. Login as Admin again
3. Click "📊 Dashboard"
```

**2. Find Pending Booking**
```
1. Look for booking with status "Pending"
2. Shows: Field name, User address, Time, Price
```

**3. Confirm Booking**
```
1. Click "✓ Xác Nhận" button for the booking
2. MetaMask popup appears
3. Click "Confirm"
4. Wait for transaction
5. Booking status changes to "Confirmed" (blue badge)
```

### Expected Output
✅ Booking status changes from "Pending" to "Confirmed"  
✅ User can now check-in for the booking  
✅ Field is marked as booked for that time slot

---

## ✅ Scenario 4: User Checks Booking Status

### Setup
- Booking confirmed
- Current user is the one who made the booking

### Steps

**1. View My Bookings**
```
1. Logout and login as User (who made the booking)
2. Click "📅 Booking Của Tôi"
3. You should see your bookings
```

**2. Booking Details**
```
Shows for each booking:
- Field name (🏟️ Sân Bóng Đá A)
- Status badge:
  - Yellow: Pending
  - Blue: Confirmed
  - Green: Checked-in
  - Gray: Completed
  - Red: Cancelled
- Start time and end time
- Total price
- Actions (based on status):
  - Pending: Cancel
  - Confirmed: Check-in
  - Checked-in: Complete
```

**3. Click Booking to View Details**
```
1. Click on booking card
2. Modal shows full details:
   - Field information
   - Complete booking timeline
   - Payment amount
   - Current status
   - Available actions
```

### Expected Output
✅ Can see all your bookings  
✅ Status shows correct state  
✅ Can perform status-appropriate actions  
✅ Price calculation is accurate

---

## ✅ Scenario 5: Time Conflict Detection

### Setup
- A field with an existing booking
- Currently logged in as User

### Steps

**1. Create First Booking**
```
1. Book a field for 10:00 AM - 12:00 PM (2 hours)
2. Wait for confirmation
3. Booking now exists for that time slot
```

**2. Try to Book Overlapping Time**
```
1. Click on same field again
2. Try to select:
   - Start time: 11:00 AM (overlaps!)
   - End time: 1:00 PM
3. Click "Đặt Sân"
```

**3. See Error Message**
```
Error appears:
"❌ Lỗi: Time slot is already booked"

This is expected! The smart contract prevents double-booking.
```

**4. Book Different Time**
```
1. Try again with non-overlapping time:
   - Start: 12:00 PM (exactly when first booking ends)
   - End: 2:00 PM
2. This should work! ✅
```

### Expected Output
✅ Overlapping bookings rejected  
✅ Non-overlapping bookings accepted  
✅ Clear error message shown  
✅ Smart contract enforced this, not frontend

---

## ✅ Scenario 6: View Revenue (Admin)

### Setup
- Several bookings completed
- Currently logged in as Admin (field owner)

### Steps

**1. Go to Balance Tab**
```
1. Click "💰 Balance" tab
2. Shows:
   - My Earnings: X.XX ETH (revenue from completed bookings)
   - Platform Fee: X.XX ETH (5% of all bookings)
   - Rút Tiền button (Withdraw)
```

**2. Understand the Amounts**
```
Example:
- User booked for 2 hours at 0.1 ETH/hour = 0.2 ETH
- Platform takes 5% fee = 0.01 ETH
- Field owner gets 95% = 0.19 ETH

My Earnings: 0.19 ETH
Platform Fee: 0.01 ETH
```

**3. Withdraw Earnings**
```
1. Click "Rút Tiền" button
2. MetaMask popup shows withdrawal transaction
3. Click "Confirm"
4. Wait for confirmation
5. Balance updates: "My Earnings: 0 ETH"
6. ETH transferred to your wallet
```

### Expected Output
✅ Correct earnings calculation  
✅ 5% platform fee deducted  
✅ Withdrawal transaction succeeds  
✅ Balance resets to 0 after withdrawal

---

## ✅ Scenario 7: Run Unit Tests

### Setup
- Hardhat node running
- Contract deployed
- Frontend loaded
- Browser console open (F12)

### Steps

**1. Open Browser Console**
```
1. Press F12 (or Ctrl+Shift+I)
2. Click "Console" tab
3. You should see no errors (or just warnings)
```

**2. Run Tests**
```
In console, type:
TestRunner.runAll()

Press Enter
```

**3. Watch Test Results**
```
Tests run in sequence:
- ✅ Test 1: ...
- ✅ Test 2: ...
- ✅ Test 3: ...
...

Final output shows:
╔════════════════════════════════╗
║ 📊 FINAL RESULTS 📊           ║
║ Total: 18/18 tests passed      ║
║ Success Rate: 100%             ║
║ Status: ✅ ALL PASSED! ✅      ║
╚════════════════════════════════╝
```

### Expected Output
✅ All 18 tests pass  
✅ No errors in console  
✅ 100% success rate shown  
✅ All contract functionality verified

---

## 🔧 Advanced Testing

### Test Multiple Users

**Account #0**: Use as Admin/Field Owner
**Account #1**: Use as First User  
**Account #2**: Use as Second User

Steps:
1. Create field with Account #0
2. Book with Account #1
3. Book different time with Account #2
4. See multiple bookings in admin dashboard

### Test Time Constraints

Try these scenarios:
1. ❌ Book in the past → Should fail
2. ❌ End time before start time → Should fail
3. ❌ More than 24 hours → Should fail
4. ✅ Valid future time → Should succeed

### Test Payment Handling

1. Book field for 0.1 ETH
2. Send 0.2 ETH in transaction
3. Extra 0.1 ETH should be refunded
4. Check: Balance shows only 0.1 ETH deducted

---

## 🐛 Debugging Tips

### Check Transaction Status
```
1. Open MetaMask
2. Click activity icon (⏱️)
3. See transaction history
4. Click transaction for details
5. Should show "Confirmed"
```

### View Contract Interactions
```
1. In browser console
2. All method calls logged with [ContractService]
3. Check for errors starting with ❌
4. Info messages start with ✅
```

### Reset Everything
```
Browser:
1. Ctrl+Shift+Delete → Clear cache
2. Ctrl+Shift+R → Hard refresh

MetaMask:
1. Click account menu
2. Settings → Advanced
3. Reset Account
4. Log in again
```

---

## 📊 Expected Console Output

### When Logging In
```
[WalletSelector] 🚀 Step 1/3: Starting account loading...
[WalletSelector] 🔧 Step 1/3: Setting up Hardhat network...
[WalletSelector] ✅ Hardhat network ready
[WalletSelector] 📋 Step 2/3: Requesting accounts...
[WalletSelector] ✅ Accounts granted: 6
```

### When Creating Field
```
[ContractService] 📝 Creating field:
  - Name: Sân Bóng Đá A
  - Location: 123 Đường ABC, Hà Nội
  - Price: 0.1 ETH/hour
[ContractService] ✅ Transaction submitted: 0xabc123...
[ContractService] ⏳ Waiting for confirmation...
[ContractService] ✅ Transaction confirmed: createField success!
```

### When Booking Field
```
[ContractService] 📅 Booking field:
  - Field: 1
  - Start: 1234567890
  - End: 1234571490
  - Price: 0.2 ETH
[ContractService] ✅ Transaction submitted: 0xdef456...
[ContractService] ✅ Transaction confirmed: createBooking success!
```

---

## ✨ You're Ready!

All scenarios should work smoothly. If you encounter any issues:

1. Check browser console for errors (F12)
2. Verify Hardhat node is still running
3. Verify MetaMask is on Hardhat network
4. Hard refresh (Ctrl+Shift+R)
5. Restart Hardhat node
6. Try again

**Happy Testing! 🎉**


Você verá a saída:
```
╔════════════════════════════════════════╗
║  🧪 COMPREHENSIVE TEST SUITE 🧪       ║
║  FieldBooking dApp - Full Validation  ║
╚════════════════════════════════════════╝

🧪 ===== AUTH SERVICE TESTS =====
✅ Test 1: Login - PASSED
✅ Test 2: getCurrentUser - PASSED
✅ Test 3: Role checks - PASSED
✅ Test 4: Logout - PASSED
✅ Test 5: Session data - PASSED
✅ Test 6: Contract instance - PASSED
...
```

---

## 📊 Testes Incluídos

### **AUTH SERVICE TESTS** (6 testes)
1. ✅ Login - Verificar se user é armazenado
2. ✅ getCurrentUser - Recuperar user corretamente
3. ✅ Role checks - Validar roles (admin/user)
4. ✅ Logout - Limpar storage completamente
5. ✅ Session data - Persistência de sessão
6. ✅ Contract instance - Contract methods disponíveis

### **ABI VALIDATION TESTS** (3 testes)
1. ✅ ABI is array - Verificar tipo do ABI
2. ✅ Required functions - Validar funções obrigatórias
3. ✅ ABI structure - Estrutura para ethers.js

### **CONTRACT LOADING TESTS** (3 testes)
1. ✅ Contract address format - Validar endereço
2. ✅ Contract instantiation - Criação correta
3. ✅ Contract methods callable - Métodos funcionam

---

## 🔧 Como Usar as Funcionalidades

### **Criar Campo (Admin)**
1. Faça login como **Chủ Sân (Admin)**
2. Vá para ➕ **Create Field**
3. Preencha os dados
4. Click **✓ TAO SÂN**
5. Verifique console para logs de sucesso

### **Reservar Sân (User)**
1. Faça login como **Người Dùng (User)**
2. Vá para 🔍 **Browse Fields**
3. Click em um campo
4. Selecione data/hora
5. Click **Đặt Sân**

### **Rastrear Bookings (User)**
1. Click em 📅 **My Bookings**
2. Veja lista de reservas
3. Click para mais detalhes

---

## 🐛 Se Ainda Houver Erros

### **Erro: "abi is not iterable"**
- ✅ RESOLVIDO - Use novo ABI loader
- Verifique console: `TestRunner.runAll()`

### **Erro: "contract.createField is not a function"**
- ✅ RESOLVIDO - Contract agora salvo em memória
- Logout + Re-login
- Execute testes: `TestRunner.runAll()`

### **Erro: "Contract not instantiated"**
- Verifique se MetaMask está conectado
- Verifique se Hardhat está rodando em 127.0.0.1:8545
- Verifique console para erros de rede

---

## 📝 Checklist de Verificação

```
🧪 ANTES de usar a aplicação:
[ ] Hardhat rodando em http://127.0.0.1:8545
[ ] React rodando em http://localhost:3001
[ ] MetaMask instalado no navegador
[ ] Execute TestRunner.runAll() - todos os testes passando
[ ] Verifique localStorage: 'fieldBooking_currentUser'
[ ] Verifique sessionStorage: 'fieldBooking_session'

✅ DEPOIS de funcionalidades:
[ ] Criar campo como Admin → console sem erros
[ ] Buscar campos como User → carrega lista
[ ] Fazer booking → transação confirmada
[ ] Logout → storage limpo
[ ] Re-login → session restaurada
```

---

## 🎯 Próximos Passos

1. **Executar TestRunner.runAll()** no console
2. **Verificar se todos os 13 testes passam** ✅
3. **Fazer login e testar cada função**
4. **Verificar console para erros**
5. **Reportar qualquer erro que aparecer**

---

## 📞 Debug Info

**Para ver detalhes de cada operação, verifique o console:**

```javascript
// Seu browser console deve mostrar:
[App] Initializing...
[AuthService] Login: {...}
[ContractService] Contract created successfully
[AdminDashboard] Loaded with user...
[UserDashboard] Loaded with user...
```

Se não ver logs → erro na inicialização
Se ver erro "abi is not iterable" → ainda há problema com ABI

---

**Teste agora e reporte o resultado! 🚀**
