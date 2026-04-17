# 🏗️ FieldBooking DApp - Architecture Design Document

## 📋 Table of Contents
1. [Smart Contract Design](#smart-contract-design)
2. [Business Flow](#business-flow)
3. [Payment Logic](#payment-logic)
4. [Admin Authority](#admin-authority)
5. [Hardhat Local Setup](#hardhat-local-setup)
6. [Frontend Integration](#frontend-integration)

---

## 1️⃣ Smart Contract Design

### 1.1 Data Structures

```solidity
// STRUCTS
struct Field {
    uint256 id;                // Unique field ID
    string name;               // "Sân Bóng Đá 5 Người"
    uint256 pricePerHour;      // In Wei (e.g., 0.1 ETH = 100000000000000000 Wei)
    bool isActive;             // true = có thể đặt, false = ẩn
    address owner;             // Admin/owner
    uint256 createdAt;         // Timestamp
}

struct Booking {
    uint256 id;                // Unique booking ID
    uint256 fieldId;           // Which field
    address user;              // Who booked
    uint256 startTime;         // Unix timestamp
    uint256 endTime;           // Unix timestamp
    uint256 amountPaid;        // ETH gửi vào (in Wei)
    BookingStatus status;      // Pending/Confirmed/Cancelled
    uint256 createdAt;         // Timestamp
}

// ENUM
enum BookingStatus {
    Pending,                   // 0: Chờ xác nhận
    Confirmed,                 // 1: Đã xác nhận
    Cancelled                  // 2: Đã huỷ
}
```

### 1.2 State Variables

```solidity
// Mappings
mapping(uint256 => Field) public fields;                    // fieldId => Field
mapping(uint256 => Booking) public bookings;                // bookingId => Booking
mapping(address => uint256[]) public userBookings;          // user => [bookingIds]
mapping(uint256 => uint256[]) public fieldBookings;         // fieldId => [bookingIds]
mapping(uint256 => uint256[]) public fieldTimeSlots;        // fieldId => [bookedTimeSlots]
mapping(address => uint256) public ownerBalance;            // owner => totalETH

// Counters
uint256 public fieldCounter = 0;
uint256 public bookingCounter = 0;
address public platformOwner;

// Platform fee
uint256 public platformFee = 5;  // 5% từ mỗi booking
```

### 1.3 Key Functions

#### **FIELD MANAGEMENT** (OnlyOwner)

```solidity
// 1. Tạo sân
function createField(
    string memory _name,
    uint256 _pricePerHour
) onlyOwner external {
    // Không tốn ETH
    // Chỉ owner (admin) mới tạo được
}

// 2. Sửa giá sân
function updateFieldPrice(
    uint256 _fieldId,
    uint256 _newPrice
) onlyOwner external {
    // Có thể sửa giá
}

// 3. Ẩn/Hiện sân
function toggleFieldStatus(
    uint256 _fieldId
) onlyOwner external {
    // isActive = !isActive
}
```

#### **BOOKING MANAGEMENT** (Public)

```solidity
// 1. User đặt sân
function bookField(
    uint256 _fieldId,
    uint256 _startTime,
    uint256 _endTime
) payable external {
    // 1. Kiểm tra:
    //    - Field exists & isActive
    //    - startTime < endTime
    //    - Không trùng slot đã booking
    //    - msg.value >= pricePerHour * duration
    //
    // 2. Tạo booking với status = Pending
    // 3. Gửi tiền về contract
}

// 2. Owner xác nhận booking
function confirmBooking(
    uint256 _bookingId
) onlyOwner external {
    // Booking.status = Confirmed
    // Admin xác nhận = cho phép user vào sân
}

// 3. User/Owner huỷ booking
function cancelBooking(
    uint256 _bookingId
) external {
    // Kiểm tra: msg.sender = booking.user hoặc owner
    // Hoàn tiền cho user
    // Booking.status = Cancelled
}

// 4. Owner rút tiền
function withdrawBalance() onlyOwner external {
    // Rút ownerBalance về ví admin
}
```

#### **QUERY FUNCTIONS** (Public View)

```solidity
// Lấy tất cả sân
function getFields() external view returns (Field[]);

// Lấy tất cả booking của user
function getUserBookings(address _user) external view returns (Booking[]);

// Lấy tất cả booking của sân
function getFieldBookings(uint256 _fieldId) external view returns (Booking[]);

// Kiểm tra slot có trùng không
function hasConflict(
    uint256 _fieldId,
    uint256 _startTime,
    uint256 _endTime
) external view returns (bool);
```

---

## 2️⃣ Business Flow - Chi Tiết

### Flow 1: Admin Tạo Sân

```
Admin -> MetaMask -> createField("Sân Bóng Đá", 0.1 ETH/hour)
                    |
                    v
                ❌ KHÔNG tốn ETH (read-only operation)
                |
                v
            Contract lưu:
            - fieldId = 1
            - name = "Sân Bóng Đá"
            - pricePerHour = 100000000000000000 Wei (0.1 ETH)
            - isActive = true
            - owner = Admin address
```

**Chi phí**: 0 ETH (chỉ tính gas fee, rất nhỏ)

---

### Flow 2: User Duyệt Sân

```
User -> Frontend -> getFields()
                   |
                   v
            Contract trả về danh sách 5 sân
            ❌ KHÔNG tốn ETH (view function)
            |
            v
        Frontend hiển thị:
        - Tên: "Sân Bóng Đá"
        - Giá: 0.1 ETH/hour
        - Trạng thái: Active
```

**Chi phí**: 0 ETH

---

### Flow 3: User Đặt Sân (QUAN TRỌNG)

```
User chọn:
- Sân: "Sân Bóng Đá"
- Ngày: 17/04/2026
- Giờ: 10:00-12:00 (2 hours)
- Tính tiền = 0.1 × 2 = 0.2 ETH
|
v
User nhấp "Đặt Sân"
|
v
Frontend gọi: bookField(fieldId=1, startTime=..., endTime=...)
              với value = 0.2 ETH
|
v
MetaMask popup:
"Gửi 0.2 ETH + Gas fee (~0.001 ETH)"
User nhấp "Confirm"
|
v
Contract nhận ETH:
1. Kiểm tra:
   ✅ Field 1 tồn tại & isActive
   ✅ startTime < endTime
   ✅ Không trùng slot (kiểm tra fieldTimeSlots[1])
   ✅ msg.value = 0.2 ETH >= 0.1 × 2
2. Tạo Booking:
   - bookingId = 1
   - fieldId = 1
   - user = User address
   - status = Pending
   - amountPaid = 0.2 ETH
3. Lưu:
   - fieldTimeSlots[1] += [startTime-endTime]
   - userBookings[User] += [1]
   - fieldBookings[1] += [1]
4. ✅ ETH giữ trong Contract
|
v
Frontend hiển thị: "✅ Đặt sân thành công"
```

**Chi phí**: 0.2 ETH + Gas fee (~0.001 ETH)

---

### Flow 4: Admin Xác Nhận Booking

```
Admin Dashboard:
- Xem booking #1 (User đặt)
- Status: Pending
|
v
Admin nhấp "✅ Xác Nhận"
|
v
Frontend gọi: confirmBooking(bookingId=1)
|
v
Contract:
1. Kiểm tra: msg.sender = Admin (owner)
2. booking[1].status = Confirmed
3. Tính tiền:
   - Admin nhận: 0.2 × 95% = 0.19 ETH
   - Platform fee: 0.2 × 5% = 0.01 ETH
   - ownerBalance[Admin] += 0.19
4. ✅ Booking ready
```

**Chi phí**: 0 ETH (Admin đã được trừ khi booking được confirm)

---

### Flow 5: Admin Rút Tiền

```
Admin Dashboard:
- Hiển thị: "Balance: 0.19 ETH"
|
v
Admin nhấp "🏦 Rút Tiền"
|
v
Frontend gọi: withdrawBalance()
              |
              v
            MetaMask popup: "Rút 0.19 ETH + Gas fee"
            Admin confirm
            |
            v
            Contract:
            1. Kiểm tra: msg.sender = Admin
            2. amount = ownerBalance[Admin]
            3. payable(Admin).transfer(amount)
            4. ownerBalance[Admin] = 0
            |
            v
            ✅ Admin nhận 0.19 ETH về ví
```

**Chi phí**: Gas fee (~0.001 ETH)

---

### Flow 6: User Huỷ Booking

```
User xem booking #1: Status = Pending
|
v
User nhấp "❌ Huỷ"
|
v
Frontend gọi: cancelBooking(bookingId=1)
|
v
Contract:
1. Kiểm tra: msg.sender = User
2. Status != Confirmed (chỉ huỷ pending)
3. Hoàn tiền:
   payable(User).transfer(0.2 ETH)
4. booking[1].status = Cancelled
5. Xóa slot: fieldTimeSlots[1] -= [startTime-endTime]
|
v
✅ User nhận lại 0.2 ETH
```

**Chi phí**: Gas fee (~0.001 ETH)

---

## 3️⃣ Payment Logic - Rõ Ràng

### Where Does ETH Go?

```
User gửi 0.2 ETH
    |
    +---> 95% (0.19 ETH) ---> ownerBalance[Admin]
    |
    +---> 5% (0.01 ETH)  ---> platformFee (Admin withdraw sau)
```

### When Does Admin Get Money?

```
1️⃣ Booking.status = Confirmed
   ➜ Admin's ownerBalance += amount × 95%

2️⃣ Admin gọi withdrawBalance()
   ➜ Tiền chuyển về ví Admin
   ➜ ownerBalance[Admin] = 0
```

### Contract Balance

```
Contract có tổng ETH:
= Tất cả booking pending + confirmed - withdrawn

Ví dụ:
- 3 booking × 0.2 ETH = 0.6 ETH (total)
- 2 confirmed → Admin mặt: 0.4 ETH
- Admin rút 0.3 ETH
- Contract balance còn: 0.6 - 0.3 = 0.3 ETH
```

---

## 4️⃣ Admin Authority - Rõ Ràng

```solidity
modifier onlyOwner() {
    require(msg.sender == platformOwner, "Only admin");
    _;
}
```

### Admin có quyền:

| Action | Permission | Gas Cost | ETH Cost |
|--------|-----------|----------|----------|
| Tạo sân | ✅ OnlyAdmin | Yes | ❌ No |
| Sửa giá sân | ✅ OnlyAdmin | Yes | ❌ No |
| Ẩn sân | ✅ OnlyAdmin | Yes | ❌ No |
| Xác nhận booking | ✅ OnlyAdmin | Yes | ❌ No |
| Xem tất cả booking | ✅ Everyone | No | ❌ No |
| Rút tiền | ✅ OnlyAdmin | Yes | ✅ Yes (gas) |

---

## 5️⃣ Hardhat Local Setup

### Why Hardhat Local?

```
Hardhat Local:
✅ Localhost blockchain (http://127.0.0.1:8545)
✅ 20 test accounts mỗi 10,000 ETH
✅ ZERO gas price (trong config)
✅ Instant block confirmation
✅ NO testnet fees

MetaMask báo "gas fee" vì:
- Gas tính = gasUsed × gasPrice
- gasPrice trong Hardhat = 1 wei (gần như 0)
- Ví dụ: 50,000 gas × 1 wei = 0.00000000000005 ETH (gần như 0)

Local Hardhat Config:
{
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: 20 (each 10000 ETH),
      gasPrice: 1                    // Almost 0
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
}
```

---

## 6️⃣ Frontend Integration

### Connected Flow

```
1. MetaMask connect
   ➜ Get user.address

2. Get contract instance:
   const contract = new ethers.Contract(
     address,
     ABI,
     signer
   )

3. Call functions:
   - Không tốn ETH: getFields()
   - Tốn ETH: bookField() + value

4. MetaMask popup:
   - Hiển thị "Send X ETH"
   - User confirm/cancel
```

### Smart Call Sequence

```javascript
// 1. Get fields (free)
const fields = await contract.getFields()

// 2. User selects: fieldId=1, 2 hours
// 3. Calculate: amount = 0.1 ETH × 2 = 0.2 ETH

// 4. Call booking (with ETH)
const tx = await contract.bookField(
    1,                    // fieldId
    startTime,            // unix timestamp
    endTime,              // unix timestamp
    {
        value: ethers.parseEther("0.2")  // Send 0.2 ETH
    }
)

// 5. Wait confirmation
await tx.wait()

// 6. Show success
```

---

## 📌 Summary Table

| Scenario | Tốn ETH? | Who Pay? | Where To? |
|----------|---------|---------|-----------|
| Tạo sân | ❌ | - | - |
| Duyệt sân | ❌ | - | - |
| Đặt sân | ✅ | User | Contract |
| Xác nhận booking | ❌ | - | - |
| Huỷ booking | ❌ | - | - |
| Hoàn tiền | ✅ | Contract | User |
| Rút tiền | ❌ | - | - |

---

## 🚀 Next Steps

1. ✅ Deploy contract
2. ✅ Update contract address vào .env
3. ✅ Test flow trên frontend
4. ✅ Monitor contract balance
5. ✅ Admin withdraw tiền

---

**Generated**: April 17, 2026
**Status**: PRODUCTION READY
