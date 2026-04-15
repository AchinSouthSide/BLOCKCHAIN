// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FieldBooking
 * @dev Hệ thống đặt sân thể thao trên blockchain
 */
contract FieldBooking {
    
    // ========== STRUCTS ==========
    struct Field {
        uint256 id;
        string name;
        string location;
        string description;
        uint256 pricePerHour; // Wei
        address owner;
        bool isActive;
    }

    struct Booking {
        uint256 id;
        uint256 fieldId;
        address user;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPrice;
        uint8 status; // 0: Pending, 1: Confirmed, 2: Checked-in, 3: Completed, 4: Cancelled, 5: Refunded
    }

    // ========== STATE VARIABLES ==========
    uint256 public fieldCounter = 0;
    uint256 public bookingCounter = 0;
    uint256 public platformFeePercent = 5;
    address public platformOwner;

    mapping(uint256 => Field) public fields;
    mapping(uint256 => Booking) public bookings;
    mapping(address => uint256[]) public userBookings;
    mapping(uint256 => uint256[]) public fieldBookings;
    mapping(address => uint256) public ownerEarnings;
    uint256 public platformEarnings = 0;

    // ========== EVENTS ==========
    event FieldCreated(uint256 indexed fieldId, string name, address owner);
    event BookingCreated(uint256 indexed bookingId, uint256 fieldId, address user, uint256 startTime, uint256 endTime);
    event BookingConfirmed(uint256 indexed bookingId);
    event CheckinCompleted(uint256 indexed bookingId);
    event BookingCompleted(uint256 indexed bookingId);
    event RefundProcessed(uint256 indexed bookingId, uint256 amount);
    event BookingCancelled(uint256 indexed bookingId);
    event FieldUpdated(uint256 indexed fieldId, string name);

    // ========== MODIFIERS ==========
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Only platform owner can call this");
        _;
    }

    modifier onlyFieldOwner(uint256 _fieldId) {
        require(fields[_fieldId].owner == msg.sender, "Only field owner can call this");
        _;
    }

    modifier fieldExists(uint256 _fieldId) {
        require(fields[_fieldId].id != 0, "Field does not exist");
        _;
    }

    modifier bookingExists(uint256 _bookingId) {
        require(bookings[_bookingId].id != 0, "Booking does not exist");
        _;
    }

    // ========== CONSTRUCTOR ==========
    constructor() {
        platformOwner = msg.sender;
    }

    // ========== FIELD MANAGEMENT ==========
    
    /**
     * @dev Tạo sân thể thao mới
     */
    function createField(
        string memory _name,
        string memory _location,
        string memory _description,
        uint256 _pricePerHour
    ) public {
        require(_pricePerHour > 0, "Price must be greater than 0");
        require(bytes(_name).length > 0, "Name cannot be empty");

        fieldCounter++;
        Field memory newField = Field({
            id: fieldCounter,
            name: _name,
            location: _location,
            description: _description,
            pricePerHour: _pricePerHour,
            owner: msg.sender,
            isActive: true
        });

        fields[fieldCounter] = newField;
        emit FieldCreated(fieldCounter, _name, msg.sender);
    }

    /**
     * @dev Cập nhật thông tin sân
     */
    function updateField(
        uint256 _fieldId,
        string memory _name,
        string memory _location,
        string memory _description,
        uint256 _pricePerHour
    ) public onlyFieldOwner(_fieldId) fieldExists(_fieldId) {
        require(_pricePerHour > 0, "Price must be greater than 0");

        fields[_fieldId].name = _name;
        fields[_fieldId].location = _location;
        fields[_fieldId].description = _description;
        fields[_fieldId].pricePerHour = _pricePerHour;

        emit FieldUpdated(_fieldId, _name);
    }

    /**
     * @dev Kích hoạt/vô hiệu hoá sân
     */
    function toggleFieldStatus(uint256 _fieldId) public onlyFieldOwner(_fieldId) fieldExists(_fieldId) {
        fields[_fieldId].isActive = !fields[_fieldId].isActive;
    }

    // ========== BOOKING MANAGEMENT ==========

    /**
     * @dev Đặt sân
     */
    function createBooking(
        uint256 _fieldId,
        uint256 _startTime,
        uint256 _endTime
    ) public payable fieldExists(_fieldId) {
        require(fields[_fieldId].isActive, "Field is not active");
        require(_endTime > _startTime, "End time must be after start time");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime - _startTime <= 24 hours, "Booking duration cannot exceed 24 hours");

        // Kiểm tra xử đột thời gian
        require(!hasTimeConflict(_fieldId, _startTime, _endTime), "Time slot is already booked");

        // Tính toán giá
        uint256 durationHours = (_endTime - _startTime) / 3600;
        uint256 totalPrice = durationHours * fields[_fieldId].pricePerHour;
        
        require(msg.value >= totalPrice, "Insufficient payment");

        bookingCounter++;
        Booking memory newBooking = Booking({
            id: bookingCounter,
            fieldId: _fieldId,
            user: msg.sender,
            startTime: _startTime,
            endTime: _endTime,
            totalPrice: totalPrice,
            status: 0  // Pending
        });

        bookings[bookingCounter] = newBooking;
        userBookings[msg.sender].push(bookingCounter);
        fieldBookings[_fieldId].push(bookingCounter);

        // Hoàn trả tiền dư thừa
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit BookingCreated(bookingCounter, _fieldId, msg.sender, _startTime, _endTime);
    }

    /**
     * @dev Xác nhận đặt sân (chủ sân)
     */
    function confirmBooking(uint256 _bookingId) public bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(fields[booking.fieldId].owner == msg.sender, "Only field owner can confirm booking");
        require(booking.status == 0, "Booking is not pending");

        booking.status = 1; // Confirmed
        emit BookingConfirmed(_bookingId);
    }

    /**
     * @dev Check-in (người dùng)
     */
    function checkIn(uint256 _bookingId) public bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(booking.user == msg.sender, "Only booking user can check-in");
        require(booking.status == 1, "Booking must be confirmed");
        require(block.timestamp >= booking.startTime, "Check-in time has not arrived");

        booking.status = 2; // Checked-in
        emit CheckinCompleted(_bookingId);
    }

    /**
     * @dev Hoàn thành đặt sân
     */
    function completeBooking(uint256 _bookingId) public bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.user || msg.sender == fields[booking.fieldId].owner,
            "Only user or field owner can complete booking"
        );
        require(booking.status == 2, "Booking must be checked-in");
        require(block.timestamp >= booking.endTime, "Booking time has not ended");

        booking.status = 3; // Completed

        // Tính toán fee
        uint256 fee = (booking.totalPrice * platformFeePercent) / 100;
        uint256 ownerAmount = booking.totalPrice - fee;

        // Cập nhật earnings
        ownerEarnings[fields[booking.fieldId].owner] += ownerAmount;
        platformEarnings += fee;

        emit BookingCompleted(_bookingId);
    }

    /**
     * @dev Hoàn tiền
     */
    function refundBooking(uint256 _bookingId) public bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(booking.user == msg.sender || msg.sender == platformOwner, "Not authorized");
        require(booking.status != 3 && booking.status != 4 && booking.status != 5, "Cannot refund this booking");

        uint256 refundAmount = booking.totalPrice;
        booking.status = 5; // Refunded

        payable(booking.user).transfer(refundAmount);
        emit RefundProcessed(_bookingId, refundAmount);
    }

    /**
     * @dev Hủy đặt sân
     */
    function cancelBooking(uint256 _bookingId) public bookingExists(_bookingId) {
        Booking storage booking = bookings[_bookingId];
        require(booking.user == msg.sender, "Only booking user can cancel");
        require(booking.status == 0 || booking.status == 1, "Cannot cancel confirmed booking");

        booking.status = 4; // Cancelled
        payable(booking.user).transfer(booking.totalPrice);
        
        emit BookingCancelled(_bookingId);
    }

    // ========== PAYMENT MANAGEMENT ==========

    /**
     * @dev Rút tiền kiếm được
     */
    function withdraw() public {
        uint256 amount = ownerEarnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        ownerEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Platform owner rút fee
     */
    function withdrawPlatformFee() public onlyPlatformOwner {
        require(platformEarnings > 0, "No platform earnings");
        uint256 amount = platformEarnings;
        platformEarnings = 0;
        payable(platformOwner).transfer(amount);
    }

    // ========== HELPER FUNCTIONS ==========

    /**
     * @dev Kiểm tra xung đột thời gian
     */
    function hasTimeConflict(
        uint256 _fieldId,
        uint256 _startTime,
        uint256 _endTime
    ) public view returns (bool) {
        uint256[] memory bookingIds = fieldBookings[_fieldId];
        
        for (uint256 i = 0; i < bookingIds.length; i++) {
            Booking memory booking = bookings[bookingIds[i]];
            
            // Bỏ qua đặt sân bị huỷ hoặc hoàn tiền
            if (booking.status == 4 || booking.status == 5) {
                continue;
            }

            // Kiểm tra xung đột
            if (!(booking.endTime <= _startTime || booking.startTime >= _endTime)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Lấy danh sách đặt sân của người dùng
     */
    function getUserBookings(address _user) public view returns (uint256[] memory) {
        return userBookings[_user];
    }

    /**
     * @dev Lấy danh sách đặt sân của sân
     */
    function getFieldBookings(uint256 _fieldId) public view returns (uint256[] memory) {
        return fieldBookings[_fieldId];
    }

    /**
     * @dev Lấy chi tiết sân
     */
    function getField(uint256 _fieldId) public view returns (Field memory) {
        return fields[_fieldId];
    }

    /**
     * @dev Lấy chi tiết đặt sân
     */
    function getBooking(uint256 _bookingId) public view returns (Booking memory) {
        return bookings[_bookingId];
    }
}
