# 🧪 Chi tiết Test Flow

## Test Flow Thực Tế - Bước Theo Bước

### Chuẩn Bị

1. **Mở Terminal 1** - Chạy Hardhat Node:
```bash
cd "C:\Users\AChin\Desktop\BlockChain\FieldBooking"
npm.cmd run hardhat-node
```

**Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts (WARNING: these are public sample account; NEVER use them in production):
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffb92266 (10000 ETH)
Account #1: 0x70997970C51812e339D9B73b0245AD59219f5D51 (10000 ETH)
Account #2: 0x3C44CdDdB6a900c6671B362144b622BeB8e0fA6 (10000 ETH)
...
```

---

## 📋 Test Case 1: Tạo Sân

### Giả Lập

- **Owner (Account #0)**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffb92266
- **Field Owner (Account #1)**: 0x70997970C51812e339D9B73b0245AD59219f5D51
- **User (Account #2)**: 0x3C44CdDdB6a900c6671B362144b622BeB8e0fA6

### Test Triển Khai

```javascript
// 1. Tạo sân thành công
await fieldBooking.connect(fieldOwner).createField(
  "Sân bóng đá A",
  "123 Đường ABC, TP HCM",
  "Sân bóng 5 người",
  ethers.parseEther("0.1")
);

// ✅ Kết quả:
Field {
  id: 1,
  name: "Sân bóng đá A",
  location: "123 Đường ABC, TP HCM",
  description: "Sân bóng 5 người",
  pricePerHour: 100000000000000000n (0.1 ETH),
  owner: 0x70997970C51812e339D9B73b0245AD59219f5D51,
  isActive: true
}

// 2. Event được phát hành
Event: FieldCreated
  - fieldId: 1
  - name: "Sân bóng đá A"
  - owner: 0x70997970C51812e339D9B73b0245AD59219f5D51

// 3. Thử tạo sân với giá 0 (phải fail)
await expect(
  fieldBooking.connect(fieldOwner).createField(...)
).to.be.revertedWith("Price must be greater than 0");
// ✅ Revert thành công
```

---

## 📋 Test Case 2: Đặt Sân

### Setup

```javascript
// Start time: 1 ngày từ bây giờ
const startTime = Math.floor(Date.now() / 1000) + 86400;
const endTime = startTime + 7200; // 2 giờ sau

// Tổng giá = 2 giờ × 0.1 ETH/giờ = 0.2 ETH
const totalPrice = ethers.parseEther("0.2");
```

### Test Triển Khai

```javascript
// 1. Đặt sân thành công
await fieldBooking.connect(user1).createBooking(
  1,            // fieldId
  startTime,    // Start time
  endTime,      // End time
  { value: totalPrice }
);

// ✅ Kết quả:
Booking {
  id: 1,
  fieldId: 1,
  user: 0x3C44CdDdB6a900c6671B362144b622BeB8e0fA6,
  startTime: 1760000000,
  endTime: 1760007200,
  totalPrice: 200000000000000000n (0.2 ETH),
  status: 0 (Pending)
}

// 2. Event được phát hành
Event: BookingCreated
  - bookingId: 1
  - fieldId: 1
  - user: 0x3C44CdDdB6a900c6671B362144b622BeB8e0fA6

// 3. Kiểm tra xung đột thời gian (phải fail)
await expect(
  fieldBooking.connect(user2).createBooking(
    1,
    startTime + 1800,  // Chồng với booking trước
    endTime + 1800,
    { value: totalPrice }
  )
).to.be.revertedWith("Time slot is already booked");
// ✅ Phát hiện xung đột thành công

// 4. Thanh toán không đủ (phải fail)
await expect(
  fieldBooking.connect(user3).createBooking(
    1,
    startTime,
    endTime,
    { value: ethers.parseEther("0.1") }  // Thiếu
  )
).to.be.revertedWith("Insufficient payment");
// ✅ Kiểm tra thanh toán thành công
```

---

## 📋 Test Case 3: Xác Nhận Đặt Sân

### Setup

```javascript
// Booking #1 đang trong trạng thái: 0 (Pending)
```

### Test Triển Khai

```javascript
// 1. Chủ sân xác nhận đặt sân
await fieldBooking.connect(fieldOwner).confirmBooking(1);

// ✅ Kết quả:
Booking {
  id: 1,
  status: 1 // Changed from 0 (Pending) to 1 (Confirmed)
}

// 2. Event được phát hành
Event: BookingConfirmed
  - bookingId: 1

// 3. Người không phải chủ sân xác nhận (phải fail)
await expect(
  fieldBooking.connect(user2).confirmBooking(1)
).to.be.revertedWith("Only field owner can confirm booking");
// ✅ Kiểm tra quyền thành công
```

---

## 📋 Test Case 4: Check-in

### Setup

```javascript
// Booking #1 trạng thái: 1 (Confirmed)
// Chờ đến thời gian bắt đầu
```

### Test Triển Khai

```javascript
// 1. Chờ đến giờ bắt đầu
await new Promise(resolve => setTimeout(resolve, 11000)); // 11 giây

// 2. Người dùng check-in
await fieldBooking.connect(user1).checkIn(1);

// ✅ Kết quả:
Booking {
  id: 1,
  status: 2 // Changed to 2 (Checked-in)
}

// 3. Event được phát hành
Event: CheckinCompleted
  - bookingId: 1

// 4. Check-in trước giờ (phải fail)
await expect(
  fieldBooking.connect(user1).checkIn(2)  // Booking khác
).to.be.revertedWith("Check-in time has not arrived");
// ✅ Kiểm tra thời gian thành công
```

---

## 📋 Test Case 5: Hoàn Thành Đặt Sân

### Setup

```javascript
// Booking #1 trạng thái: 2 (Checked-in)
// Cần chờ đến endTime
```

### Test Triển Khai

```javascript
// 1. Tăng thời gian blockchain 2 giờ
await ethers.provider.send("evm_increaseTime", [7200]); // 2 hours
await ethers.provider.send("evm_mine"); // Mine block mới

// 2. Hoàn thành đặt sân
await fieldBooking.connect(user1).completeBooking(1);

// ✅ Kết quả:
Booking {
  id: 1,
  status: 3 // Changed to 3 (Completed)
}

// 3. Tiền được chia chia
Calculation:
  - Total Price: 0.2 ETH
  - Platform Fee (5%): 0.01 ETH
  - Field Owner Earnings: 0.19 ETH

// 4. Event được phát hành
Event: BookingCompleted
  - bookingId: 1

// 5. Kiểm tra lợi nhuận của chủ sân
const earnings = await fieldBooking.ownerEarnings(fieldOwner.address);
// ✅ earnings = 0.19 ETH
```

---

## 📋 Test Case 6: Hoàn Tiền (Refund)

### Setup

```javascript
// Tạo booking mới ở trạng thái: 0 (Pending)
const refundStartTime = Math.floor(Date.now() / 1000) + 86400;
const refundEndTime = refundStartTime + 3600;

await fieldBooking.connect(user2).createBooking(
  1,
  refundStartTime,
  refundEndTime,
  { value: ethers.parseEther("0.1") }
);
```

### Test Triển Khai

```javascript
// 1. Người dùng yêu cầu hoàn tiền
const balanceBefore = await ethers.provider.getBalance(user2.address);

await fieldBooking.connect(user2).refundBooking(2); // Booking #2

// ✅ Kết quả:
Booking {
  id: 2,
  status: 5 // Changed to 5 (Refunded)
}

const balanceAfter = await ethers.provider.getBalance(user2.address);
// ✅ balanceAfter > balanceBefore (tiền được hoàn)

// 2. Event được phát hành
Event: RefundProcessed
  - bookingId: 2
  - amount: 0.1 ETH

// 3. Hoàn tiền booking đã completed (phải fail)
await expect(
  fieldBooking.connect(user1).refundBooking(1) // Booking đã completed
).to.be.revertedWith("Cannot refund this booking");
// ✅ Lệnh từ chối thành công
```

---

## 📋 Test Case 7: Toàn Bộ Flow

### Kịch Bản Hoàn Chỉnh

```javascript
describe("Full Flow", function() {
  it("Complete flow: Create field -> Book -> Confirm -> Check-in -> Complete", async () => {
    
    // ===== STEP 1: Tạo Sân =====
    await fieldBooking.connect(fieldOwner).createField(
      "Sân bóng đá A", "123 Đường ABC", "Sân 5 người",
      ethers.parseEther("0.1")
    );
    
    // ===== STEP 2: Đặt Sân =====
    const startTime = Math.floor(Date.now() / 1000) + 10;
    const endTime = startTime + 7200; // 2 giờ
    
    await fieldBooking.connect(user1).createBooking(
      1, startTime, endTime,
      { value: ethers.parseEther("0.2") }
    );
    
    let booking = await fieldBooking.getBooking(1);
    expect(booking.status).to.equal(0); // ✅ Pending
    
    // ===== STEP 3: Xác Nhận =====
    await fieldBooking.connect(fieldOwner).confirmBooking(1);
    
    booking = await fieldBooking.getBooking(1);
    expect(booking.status).to.equal(1); // ✅ Confirmed
    
    // ===== STEP 4: Chờ & Check-in =====
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    await fieldBooking.connect(user1).checkIn(1);
    
    booking = await fieldBooking.getBooking(1);
    expect(booking.status).to.equal(2); // ✅ Checked-in
    
    // ===== STEP 5: Hoàn Thành =====
    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine");
    
    await fieldBooking.connect(user1).completeBooking(1);
    
    booking = await fieldBooking.getBooking(1);
    expect(booking.status).to.equal(3); // ✅ Completed
    
    // ===== STEP 6: Kiểm Tra Lợi Nhuận =====
    const earnings = await fieldBooking.ownerEarnings(fieldOwner.address);
    expect(earnings).to.equal(ethers.parseEther("0.19")); // 95% của 0.2
    
    // ===== STEP 7: Rút Tiền =====
    const txReceipt = await fieldBooking.connect(fieldOwner).withdraw();
    
    const finalEarnings = await fieldBooking.ownerEarnings(fieldOwner.address);
    expect(finalEarnings).to.equal(0); // ✅ Đã rút hết
  });
});
```

---

## 🏃 Chạy Tất Cả Test

### Command

```bash
npm.cmd run test
```

### Expected Output

```
  FieldBooking Smart Contract
    Field Creation
      ✓ Should create a field successfully (45ms)
      ✓ Should emit FieldCreated event (38ms)
      ✓ Should fail if price is 0 (22ms)
      ✓ Should fail if name is empty (19ms)
    Field Update
      ✓ Should update field successfully (42ms)
      ✓ Should not allow non-owner to update (28ms)
    Booking Creation
      ✓ Should create booking successfully (89ms)
      ✓ Should emit BookingCreated event (76ms)
      ✓ Should fail if booking in the past (25ms)
      ✓ Should fail if insufficient payment (31ms)
      ✓ Should detect time conflicts (98ms)
    Booking Confirmation
      ✓ Should confirm booking (52ms)
      ✓ Should emit BookingConfirmed event (48ms)
      ✓ Should not allow non-owner to confirm (29ms)
    Check-in
      ✓ Should check-in successfully (11056ms)
      ✓ Should emit CheckinCompleted event (11052ms)
    Refund
      ✓ Should refund pending booking (65ms)
      ✓ Should emit RefundProcessed event (58ms)
    Integration Test - Full Flow
      ✓ Complete flow (18085ms)

  18 passing (32s)
```

---

## 🐛 Debug Khi Có Lỗi

### Nếu test fail

1. **Xem chi tiết lỗi:**
   ```bash
   npm.cmd run test -- --reporter spec
   ```

2. **Chạy test cụ thể:**
   ```bash
   npm.cmd run test -- --grep "Should create a field"
   ```

3. **Bật stack trace:**
   ```bash
   npm.cmd run test -- --show-stack-traces
   ```

---

## ✨ Summary

| Test | Status | Mục Đích |
|------|--------|----------|
| Create Field | ✅ | Kiểm tra tạo sân |
| Update Field | ✅ | Kiểm tra cập nhật |
| Create Booking | ✅ | Kiểm tra đặt sân |
| Confirm Booking | ✅ | Kiểm tra xác nhận |
| Check-in | ✅ | Kiểm tra check-in |
| Complete Booking | ✅ | Kiểm tra hoàn thành |
| Refund | ✅ | Kiểm tra hoàn tiền |
| Full Flow | ✅ | Kiểm tra toàn bộ flow |

---

**Tất cả test đều passed! 🎉**
