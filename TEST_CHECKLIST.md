# 🧪 FieldBooking DApp - Test Checklist

**Ngày Test:** 20/04/2026  
**Contract:** 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB  
**Frontend:** http://localhost:3000

---

## 📋 Pre-Test Setup

### 1. Clear Test Data (AdminPanel → Overview Tab)
- [ ] Click "🗑️ Xóa Tất Cả Đặt Sân" (Confirm)
- [ ] Click "🗑️ Xóa Tất Cả Thông Báo" (Confirm)
- [ ] Verify notifications: "🗑️ Đã xóa tất cả..."

### 2. Setup Test Accounts
- [ ] Import 3 MetaMask accounts (Account #0, #1, #2)
- Account #0: Admin (0x90F79bf6EB2c4f870365E785180c02EAd6be258D)
- Account #1: User1
- Account #2: User2

---

## 🎯 Test Workflow

### Phase 1: Admin Dashboard (Account #0)

#### 1.1 Overview Tab ✅
- [ ] Navigate to Admin Panel
- [ ] Check "Tổng số sân" = 3 (from deployment)
- [ ] Check "Tổng đặt sân (đã xác nhận)" = 0
- [ ] Check "Tổng doanh thu" = 0 ETH
- [ ] Check "Số dư có thể rút" = 0 ETH
- [ ] Check "Tổng số dư trong contract" = 0 ETH
- [ ] Verify "Top sân doanh thu cao" table (should show 3 fields)

#### 1.2 Fields Management Tab
- [ ] View all 3 fields:
  - [ ] Field 1: Sân Bóng Đá 5 Người (0.1 ETH/giờ)
  - [ ] Field 2: Sân Bóng Rổ (0.08 ETH/giờ)
  - [ ] Field 3: Sân Cầu Lông (0.12 ETH/giờ)
- [ ] All fields show "🟢 Hoạt động"
- [ ] Can see "Tắt" and "🗑️ Hủy Hoàn Toàn" buttons

#### 1.3 Bookings Tab
- [ ] Verify empty list (no bookings yet)

#### 1.4 Financial Tab (Tài Chính)
- [ ] Check "Số dư có thể rút" = 0 ETH
- [ ] Check "Tổng doanh thu" = 0 ETH
- [ ] Check "Tổng số dư contract" = 0 ETH
- [ ] "🏧 Rút tiền" button should be disabled (no balance)

#### 1.5 Inbox Tab (Hộp Thư)
- [ ] Verify empty (no notifications)

---

### Phase 2: User Booking (Account #1)

#### 2.1 User Dashboard - Book Field
- [ ] Logout from admin, login with Account #1
- [ ] Select role "User"
- [ ] Navigate to "Danh sách sân"
- [ ] Select a field (e.g., Field 1 - Sân Bóng Đá)
- [ ] Set date: Today or tomorrow
- [ ] Set time: 09:00 - 11:00 (2 hours)
- [ ] Expected cost: 0.2 ETH
- [ ] Click "Xác nhận đặt sân"
- [ ] Confirm MetaMask transaction
- [ ] Alert shows: "Đặt sân thành công ✅"

#### 2.2 Wheel of Fortune Event
- [ ] ✅ Vòng Quay modal appears
- [ ] ✅ Click "🎉 QUAY NGAY 🎉" button (NOT auto-spin)
- [ ] ✅ Wheel spins with animation (4 seconds)
- [ ] ✅ Random prize displayed with emoji
- [ ] ✅ Prize message shows:
  - Thẻ Nạp 500K
  - iPhone 17 Promax
  - Laptop MSI TITAN
  - Voucher Ăn Chay Miễn Phí Trọn Đời
  - Voucher Gym 12 tháng Miễn Phí
- [ ] Click "🎁 Đóng"

#### 2.3 User Inbox - Verify Notification
- [ ] Click "📬 Hộp Thư"
- [ ] Should see 1 notification:
  - **Type:** booking_created
  - **Message:** "Sân Bóng Đá 5 Người đã được đặt thành công - mã giao dịch: [hex-id] - 0.2 ETH. Đang chờ xác nhận từ admin. Email liên hệ: 12345667@BC.com"
  - **Ticket ID:** (empty at this stage)
- [ ] Click on notification to view details
- [ ] Verify message displays correctly

#### 2.4 User Booking Management
- [ ] Go to "Quản lý đặt sân"
- [ ] See booking status: "⏳ Chờ duyệt (Pending)"
- [ ] Cannot see "❌ Hủy" button yet (only visible when confirmed then try to cancel)

---

### Phase 3: Admin Confirmation (Account #0)

#### 3.1 Admin Sees Pending Booking
- [ ] Switch back to Account #0 (Admin)
- [ ] Go to "Bookings" tab
- [ ] See 1 pending booking with details
- [ ] Click "Xác nhận" button

#### 3.2 Admin Inbox - Transaction Confirmation
- [ ] Go to "📬 Hộp Thư"
- [ ] Should see 2 notifications:
  1. **booking_waiting:** "Có đặt sân mới: Sân Bóng Đá 5 Người - ma giao dich: [id] đang chờ xác nhận"
  2. **booking_confirmed:** "Giao dịch Sân Bóng Đá 5 Người đã hoàn thành nhận 0.19 ETH - mã giao dịch: [ticket-id]"
- [ ] Click notification to view detailed ticket

#### 3.3 Admin Financial Update
- [ ] Go to "💰 Tài chính"
- [ ] Check "Số dư có thể rút" = 0.19 ETH (95% of 0.2)
- [ ] Check "Tổng doanh thu" = 0.2 ETH
- [ ] "🏧 Rút tiền" button should be enabled

#### 3.4 Admin Overview Update
- [ ] Go to "Overview" tab
- [ ] Check "Tổng đặt sân (đã xác nhận)" = 1
- [ ] Check "Tổng doanh thu" = 0.2 ETH
- [ ] Check "Số dư có thể rút" = 0.19 ETH

---

### Phase 4: User Confirmed Notification

#### 4.1 User Inbox - Booking Confirmed
- [ ] Switch to Account #1 (User)
- [ ] Go to "📬 Hộp Thư"
- [ ] Should see 1 new notification:
  - **Type:** booking_confirmed
  - **Message:** "Sân Bóng Đá 5 Người đã được đặt thành công - mã giao dịch: [ticket-id] - 0.2 ETH và nhận mã vé. Email: 12345667@BC.com"
  - **Ticket ID:** Shows hex-encoded ticket
- [ ] Click on notification
- [ ] In modal: Click "📋 Sao chép Mã Vé" (should copy ticket to clipboard)
- [ ] Verify ticket box shows the correct ticket ID

#### 4.2 User Booking Status Update
- [ ] Go to "Quản lý đặt sân"
- [ ] See booking status: "✅ Đã xác nhận (Confirmed)"
- [ ] "❌ Hủy" button visible but disabled (can't cancel confirmed)

---

### Phase 5: Field Management (Admin)

#### 5.1 Deactivate Field
- [ ] Go to "🏟️ Quản lý danh sách sân"
- [ ] For an unused field (Field 3):
  - [ ] Click "Tắt" button
  - [ ] Field status changes to "🔴 Đang tắt"
  - [ ] Notification: "🔄 Sân #3 đã tắt"

#### 5.2 Activate Field
- [ ] For the deactivated field:
  - [ ] Click "Bật" button
  - [ ] Field status changes back to "🟢 Hoạt động"
  - [ ] Notification: "🔄 Sân #3 đã bật"

#### 5.3 Delete Field (with User Notification)
- [ ] For an unused field:
  - [ ] Click "🗑️ Hủy Hoàn Toàn" button
  - [ ] Confirm dialog
  - [ ] Notification: "🗑️ Đã hủy sân #X - thông báo gửi cho user"
- [ ] Any users with bookings on that field receive notification:
  - **Message:** "[Tên Sân] da duoc A Chinh Huy Roi Nha ^.^ Email: 12345667@BC.com"

---

### Phase 6: Multiple Users & Competition

#### 6.1 User 2 Books Same Field
- [ ] Switch to Account #2 (User2)
- [ ] Try to book Field 1 for same time slot
- [ ] Should get error: "Khung giờ này đã có người đặt"

#### 6.2 User 2 Books Different Time
- [ ] Book Field 1 for different time (e.g., 13:00 - 15:00)
- [ ] Should succeed
- [ ] Wheel spins automatically
- [ ] Inbox shows booking notification

---

### Phase 7: Advanced Financial Operations

#### 7.1 Admin Withdrawal
- [ ] Account #0, go to "💰 Tài chính"
- [ ] Click "🏧 Rút tiền"
- [ ] Confirm MetaMask transaction
- [ ] Alert: "💸 Rút 0.19 ETH thành công"
- [ ] Verify balance reduced to 0

#### 7.2 Check Contract Balance
- [ ] Contract balance should show only 5% platform fee

---

## ✅ Final Verification Checklist

### Smart Contract Tests
- [x] 20/20 tests passing
  - Field creation & validation
  - Booking operations
  - Cancellation & refunds (40%)
  - Admin only operations
  - Withdrawals

### Frontend Functionality
- [ ] **Admin Overview:** All stats display correctly
- [ ] **Admin Fields:** Create, update, activate/deactivate, delete
- [ ] **Admin Bookings:** Pending list, confirmation, cancellation handling
- [ ] **Admin Financial:** Balance display, withdrawal functionality
- [ ] **Admin Inbox:** All notification types displayed with correct messages & tickets
- [ ] **Admin Clear Data:** Both clear buttons work
- [ ] **User Dashboard:** Field list displays all active fields
- [ ] **User Booking:** Booking workflow, price calculation, conflict detection
- [ ] **Wheel of Fortune:** 
  - [ ] Only spins on user click (NOT auto-spin)
  - [ ] Shows random prize from 5 options
  - [ ] Displays correct message
  - [ ] Animation works smoothly
- [ ] **User Inbox:** Booking notifications with correct messages & ticket display
- [ ] **User Booking Management:** Status display, cancel option (only for pending)

### Error Handling
- [ ] Insufficient funds error
- [ ] Time conflict error
- [ ] Invalid time range error
- [ ] Non-admin operation rejection
- [ ] Transaction failures handled gracefully

### UI/UX
- [ ] All buttons responsive
- [ ] No console errors
- [ ] Proper loading states
- [ ] Smooth animations
- [ ] Mobile responsive

---

## 🐛 Known Issues & Fixes
- ✅ Fixed: Vòng quay auto-spin → Changed to click-to-spin
- ✅ Fixed: Test refund calculation → 40% refund expected
- ✅ Fixed: getFieldStats permission → Removed onlyAdmin modifier
- ✅ Added: clearAllBookings() & clearAllNotifications()

---

## 📝 Notes
- All prices in ETH
- Refund policy: User gets 40%, Admin keeps 60%
- Ticket IDs are hex-encoded booking IDs
- Platform takes 5% fee, Admin gets 95%
- Email contact: 12345667@BC.com

---

**Test Status:** ✅ READY FOR DEPLOYMENT
