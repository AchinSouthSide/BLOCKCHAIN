// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FieldBooking - Sports Field Booking DApp
 * @dev Production-grade smart contract for booking sports fields with Ethereum payments
 * @notice This contract handles field creation, booking management, and payment distribution
 */

contract FieldBooking {
    
    // ==================== ENUMS & STRUCTS ====================
    
    /**
     * @dev Booking status enum
     * Pending: User booked, waiting for admin confirmation
     * Confirmed: Admin confirmed, user can check-in
     * Cancelled: Booking cancelled, user refunded
     */
    enum BookingStatus {
        Pending,      // 0
        Confirmed,    // 1
        Cancelled     // 2
    }

    /**
     * @dev Represents a sports field
     */
    struct Field {
        uint256 id;                 // Unique field ID
        string name;                // Field name: "Sân Bóng Đá 5 Người"
        uint256 pricePerHour;       // Price in Wei (e.g., 0.1 ETH = 100000000000000000)
        bool isActive;              // Whether field is available for booking
        address owner;              // Field owner (admin)
        uint256 createdAt;          // Timestamp
    }

    /**
     * @dev Represents a booking
     */
    struct Booking {
        uint256 id;                 // Unique booking ID
        uint256 fieldId;            // Which field
        address user;               // User who booked
        uint256 startTime;          // Start time (unix timestamp)
        uint256 endTime;            // End time (unix timestamp)
        uint256 amountPaid;         // Amount paid in Wei
        BookingStatus status;       // Booking status
        uint256 createdAt;          // Booking creation time
    }

    // ==================== STATE VARIABLES ====================

    // Platform owner (admin)
    address public platformOwner;

    // Counters
    uint256 public fieldCounter = 0;
    uint256 public bookingCounter = 0;

    // Platform fee: 5% of each booking
    uint256 public constant PLATFORM_FEE_PERCENT = 5;

    // Mappings
    mapping(uint256 => Field) public fields;                    // fieldId => Field
    mapping(uint256 => Booking) public bookings;                // bookingId => Booking
    mapping(address => uint256[]) public userBookings;          // user => [bookingIds]
    mapping(uint256 => uint256[]) public fieldBookings;         // fieldId => [bookingIds]
    mapping(address => uint256) public ownerBalance;            // owner => balance to withdraw
    
    // Contract total balance
    uint256 public contractBalance = 0;

    // ==================== ADMIN STATISTICS ====================
    
    // Track daily revenue for admin dashboard
    mapping(uint256 => uint256) public dailyRevenue;        // day (timestamp / 86400) => revenue in Wei
    
    // Track revenue per field
    mapping(uint256 => uint256) public fieldTotalRevenue;   // fieldId => total revenue
    mapping(uint256 => uint256) public fieldBookingCount;   // fieldId => total completed bookings
    
    // Track date when bookings occur
    uint256[] public bookingDates;                           // List of unique dates with bookings

    // ==================== EVENTS ====================

    event FieldCreated(
        uint256 indexed fieldId,
        string name,
        uint256 pricePerHour,
        address owner
    );

    event FieldUpdated(
        uint256 indexed fieldId,
        uint256 newPrice
    );

    event FieldStatusChanged(
        uint256 indexed fieldId,
        bool isActive
    );

    event BookingCreated(
        uint256 indexed bookingId,
        uint256 fieldId,
        address user,
        uint256 startTime,
        uint256 endTime,
        uint256 amount
    );

    event BookingConfirmed(
        uint256 indexed bookingId,
        uint256 ownerAmount,
        uint256 feeAmount
    );

    event BookingCancelled(
        uint256 indexed bookingId,
        address user,
        uint256 refundAmount
    );

    event BalanceWithdrawn(
        address indexed owner,
        uint256 amount
    );

    // ==================== ADMIN EVENTS ====================
    
    /**
     * @dev Event when booking is completed and payment distributed
     * Admin listens to this to receive payment notifications
     */
    event BookingPaymentReceived(
        uint256 indexed bookingId,
        uint256 fieldId,
        address indexed user,
        uint256 amount,
        uint256 adminEarnings,
        uint256 timestamp
    );

    /**
     * @dev Event when admin withdraws earnings
     */
    event AdminWithdrawal(
        address indexed admin,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );

    // ==================== MODIFIERS ====================

    /**
     * @dev Only owner (admin) can call
     */
    modifier onlyOwner() {
        require(msg.sender == platformOwner, "Only owner can call this");
        _;
    }

    /**
     * @dev Field must exist
     */
    modifier fieldExists(uint256 _fieldId) {
        require(_fieldId > 0 && _fieldId <= fieldCounter, "Field does not exist");
        require(fields[_fieldId].id != 0, "Field not found");
        _;
    }

    /**
     * @dev Booking must exist
     */
    modifier bookingExists(uint256 _bookingId) {
        require(_bookingId > 0 && _bookingId <= bookingCounter, "Booking does not exist");
        require(bookings[_bookingId].id != 0, "Booking not found");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    /**
     * @dev Initialize contract with deployer as owner
     */
    constructor() {
        platformOwner = msg.sender;
    }

    // ==================== FIELD MANAGEMENT ====================

    /**
     * @dev Create new field (only owner)
     * @param _name Field name
     * @param _pricePerHour Price per hour in Wei
     * 
     * NO ETH required - only gas fee
     */
    function createField(
        string memory _name,
        uint256 _pricePerHour
    ) external onlyOwner {
        require(bytes(_name).length > 0, "Field name cannot be empty");
        require(_pricePerHour > 0, "Price must be greater than 0");

        fieldCounter++;

        fields[fieldCounter] = Field({
            id: fieldCounter,
            name: _name,
            pricePerHour: _pricePerHour,
            isActive: true,
            owner: msg.sender,
            createdAt: block.timestamp
        });

        emit FieldCreated(fieldCounter, _name, _pricePerHour, msg.sender);
    }

    /**
     * @dev Update field price (only owner)
     * @param _fieldId Field ID
     * @param _newPrice New price per hour
     */
    function updateFieldPrice(
        uint256 _fieldId,
        uint256 _newPrice
    ) external onlyOwner fieldExists(_fieldId) {
        require(_newPrice > 0, "Price must be greater than 0");
        
        fields[_fieldId].pricePerHour = _newPrice;
        
        emit FieldUpdated(_fieldId, _newPrice);
    }

    /**
     * @dev Toggle field status (active/inactive)
     * @param _fieldId Field ID
     */
    function toggleFieldStatus(
        uint256 _fieldId
    ) external onlyOwner fieldExists(_fieldId) {
        fields[_fieldId].isActive = !fields[_fieldId].isActive;
        
        emit FieldStatusChanged(_fieldId, fields[_fieldId].isActive);
    }

    // ==================== BOOKING MANAGEMENT ====================

    /**
     * @dev Book a field
     * @param _fieldId Field ID
     * @param _startTime Start time (unix timestamp)
     * @param _endTime End time (unix timestamp)
     * 
     * REQUIRES: ETH payment = pricePerHour × duration (in hours)
     */
    function bookField(
        uint256 _fieldId,
        uint256 _startTime,
        uint256 _endTime
    ) external payable fieldExists(_fieldId) {
        require(fields[_fieldId].isActive, "Field is not active");
        require(_startTime < _endTime, "Invalid time range");
        require(_startTime >= block.timestamp, "Start time must be in future");

        // Calculate duration and price
        uint256 durationSeconds = _endTime - _startTime;
        require(durationSeconds <= 24 hours, "Booking duration cannot exceed 24 hours");
        
        uint256 durationHours = durationSeconds / 3600;
        if (durationSeconds % 3600 != 0) {
            durationHours++; // Round up
        }

        uint256 requiredAmount = fields[_fieldId].pricePerHour * durationHours;
        require(msg.value >= requiredAmount, "Insufficient payment");

        // Check for time conflicts
        require(
            !hasTimeConflict(_fieldId, _startTime, _endTime),
            "Time slot is already booked"
        );

        // Create booking
        bookingCounter++;
        bookings[bookingCounter] = Booking({
            id: bookingCounter,
            fieldId: _fieldId,
            user: msg.sender,
            startTime: _startTime,
            endTime: _endTime,
            amountPaid: msg.value,
            status: BookingStatus.Pending,
            createdAt: block.timestamp
        });

        // Add to user bookings
        userBookings[msg.sender].push(bookingCounter);

        // Add to field bookings
        fieldBookings[_fieldId].push(bookingCounter);

        // Update contract balance
        contractBalance += msg.value;

        // Refund excess payment
        if (msg.value > requiredAmount) {
            uint256 excessAmount = msg.value - requiredAmount;
            payable(msg.sender).transfer(excessAmount);
            contractBalance -= excessAmount;
        }

        emit BookingCreated(
            bookingCounter,
            _fieldId,
            msg.sender,
            _startTime,
            _endTime,
            msg.value
        );
    }

    /**
     * @dev Admin confirms booking
     * @param _bookingId Booking ID
     * 
     * When confirmed:
     * - Admin receives 95% of payment
     * - Platform receives 5% of payment
     * - Revenue is tracked for statistics
     */
    function confirmBooking(
        uint256 _bookingId
    ) external onlyOwner bookingExists(_bookingId) {
        require(
            bookings[_bookingId].status == BookingStatus.Pending,
            "Only pending bookings can be confirmed"
        );

        Booking storage booking = bookings[_bookingId];
        booking.status = BookingStatus.Confirmed;

        // Calculate and distribute fees
        uint256 ownerAmount = (booking.amountPaid * (100 - PLATFORM_FEE_PERCENT)) / 100;
        uint256 feeAmount = booking.amountPaid - ownerAmount;

        // Add to owner balance
        ownerBalance[platformOwner] += ownerAmount;

        // ==================== TRACK ADMIN STATISTICS ====================
        
        // Track daily revenue (by day: timestamp / 86400)
        uint256 dayKey = block.timestamp / 86400;
        dailyRevenue[dayKey] += booking.amountPaid;
        
        // Track field revenue and booking count
        fieldTotalRevenue[booking.fieldId] += booking.amountPaid;
        fieldBookingCount[booking.fieldId] += 1;

        emit BookingConfirmed(_bookingId, ownerAmount, feeAmount);
        
        // Emit admin notification event
        emit BookingPaymentReceived(
            _bookingId,
            booking.fieldId,
            booking.user,
            booking.amountPaid,
            ownerAmount,
            block.timestamp
        );
    }

    /**
     * @dev Cancel booking and refund user
     * @param _bookingId Booking ID
     */
    function cancelBooking(
        uint256 _bookingId
    ) external bookingExists(_bookingId) {
        require(
            bookings[_bookingId].status != BookingStatus.Cancelled,
            "Booking is already cancelled"
        );

        Booking storage booking = bookings[_bookingId];

        // Only user or owner can cancel
        require(
            msg.sender == booking.user || msg.sender == platformOwner,
            "Not authorized to cancel this booking"
        );

        // Cannot cancel confirmed bookings (payment already distributed)
        require(
            booking.status == BookingStatus.Pending,
            "Cannot cancel confirmed bookings"
        );

        booking.status = BookingStatus.Cancelled;

        // Refund user
        uint256 refundAmount = booking.amountPaid;
        payable(booking.user).transfer(refundAmount);
        contractBalance -= refundAmount;

        emit BookingCancelled(_bookingId, booking.user, refundAmount);
    }

    // ==================== QUERY FUNCTIONS ====================

    /**
     * @dev Get all fields
     */
    function getFields() external view returns (Field[] memory) {
        Field[] memory result = new Field[](fieldCounter);
        for (uint256 i = 1; i <= fieldCounter; i++) {
            result[i - 1] = fields[i];
        }
        return result;
    }

    /**
     * @dev Get field by ID
     */
    function getField(uint256 _fieldId) external view fieldExists(_fieldId) returns (Field memory) {
        return fields[_fieldId];
    }

    /**
     * @dev Get bookings for user
     */
    function getUserBookings(address _user) external view returns (Booking[] memory) {
        uint256[] memory bookingIds = userBookings[_user];
        Booking[] memory result = new Booking[](bookingIds.length);

        for (uint256 i = 0; i < bookingIds.length; i++) {
            result[i] = bookings[bookingIds[i]];
        }
        return result;
    }

    /**
     * @dev Get bookings for field
     */
    function getFieldBookings(uint256 _fieldId) external view fieldExists(_fieldId) returns (Booking[] memory) {
        uint256[] memory bookingIds = fieldBookings[_fieldId];
        Booking[] memory result = new Booking[](bookingIds.length);

        for (uint256 i = 0; i < bookingIds.length; i++) {
            result[i] = bookings[bookingIds[i]];
        }
        return result;
    }

    /**
     * @dev Check if time slot has conflict
     */
    function hasTimeConflict(
        uint256 _fieldId,
        uint256 _startTime,
        uint256 _endTime
    ) public view fieldExists(_fieldId) returns (bool) {
        uint256[] memory bookingIds = fieldBookings[_fieldId];

        for (uint256 i = 0; i < bookingIds.length; i++) {
            Booking memory booking = bookings[bookingIds[i]];

            // Skip cancelled bookings
            if (booking.status == BookingStatus.Cancelled) {
                continue;
            }

            // Check for overlap
            if (!(_endTime <= booking.startTime || _startTime >= booking.endTime)) {
                return true; // Conflict found
            }
        }

        return false; // No conflict
    }

    /**
     * @dev Get pending bookings count
     */
    function getPendingBookingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= bookingCounter; i++) {
            if (bookings[i].status == BookingStatus.Pending) {
                count++;
            }
        }
        return count;
    }

    // ==================== PAYMENT MANAGEMENT ====================

    /**
     * @dev Get owner balance to withdraw
     */
    function getBalance(address _owner) external view returns (uint256) {
        return ownerBalance[_owner];
    }

    /**
     * @dev Owner withdraws balance (admin only)
     * @notice Only admin can withdraw accumulated earnings
     */
    function withdrawBalance() external onlyOwner {
        uint256 amount = ownerBalance[msg.sender];
        require(amount > 0, "No balance to withdraw");

        ownerBalance[msg.sender] = 0;
        contractBalance -= amount;

        payable(msg.sender).transfer(amount);

        emit BalanceWithdrawn(msg.sender, amount);
        
        // Emit admin withdrawal event for tracking
        emit AdminWithdrawal(msg.sender, amount, 0, block.timestamp);
    }

    // ==================== ADMIN STATISTICS (ADMIN ONLY) ====================

    /**
     * @dev Get revenue for a specific day (admin only)
     * @param _date Unix timestamp date (any time within the day)
     * @return Daily revenue in Wei
     */
    function getDailyRevenue(uint256 _date) external view onlyOwner returns (uint256) {
        uint256 dayKey = _date / 86400;
        return dailyRevenue[dayKey];
    }

    /**
     * @dev Get total revenue for a specific field (admin only)
     * @param _fieldId Field ID
     * @return Total revenue from all completed bookings for this field
     */
    function getFieldRevenue(uint256 _fieldId) external view onlyOwner fieldExists(_fieldId) returns (uint256) {
        return fieldTotalRevenue[_fieldId];
    }

    /**
     * @dev Get total confirmed bookings for a field (admin only)
     * @param _fieldId Field ID
     * @return Number of confirmed bookings
     */
    function getFieldBookingCount(uint256 _fieldId) external view onlyOwner fieldExists(_fieldId) returns (uint256) {
        return fieldBookingCount[_fieldId];
    }

    /**
     * @dev Get most booked field (admin only)
     * @return fieldId The most booked field ID
     * @return bookingCount Number of bookings
     */
    function getMostBookedField() external view onlyOwner returns (uint256 fieldId, uint256 bookingCount) {
        uint256 maxBookings = 0;
        uint256 mostBookedId = 0;

        for (uint256 i = 1; i <= fieldCounter; i++) {
            if (fields[i].id != 0 && fieldBookingCount[i] > maxBookings) {
                maxBookings = fieldBookingCount[i];
                mostBookedId = i;
            }
        }

        return (mostBookedId, maxBookings);
    }

    /**
     * @dev Get admin dashboard summary (admin only)
     * @return totalFields Total number of active fields
     * @return totalBookings Total number of confirmed bookings
     * @return totalRevenue Total revenue collected (all-time)
     * @return adminBalance Admin's current withdrawable balance
     * @return contractTotalBalance Total ETH in contract
     */
    function getAdminSummary() external view onlyOwner returns (
        uint256 totalFields,
        uint256 totalBookings,
        uint256 totalRevenue,
        uint256 adminBalance,
        uint256 contractTotalBalance
    ) {
        uint256 activeFields = 0;
        uint256 confirmedBookings = 0;
        uint256 allTimeRevenue = 0;

        // Count active fields
        for (uint256 i = 1; i <= fieldCounter; i++) {
            if (fields[i].id != 0 && fields[i].isActive) {
                activeFields++;
            }
        }

        // Count confirmed bookings and calculate revenue
        for (uint256 i = 1; i <= bookingCounter; i++) {
            if (bookings[i].id != 0 && bookings[i].status == BookingStatus.Confirmed) {
                confirmedBookings++;
                allTimeRevenue += bookings[i].amountPaid;
            }
        }

        return (
            activeFields,
            confirmedBookings,
            allTimeRevenue,
            ownerBalance[platformOwner],
            contractBalance
        );
    }

    /**
     * @dev Get field statistics for admin view (admin only)
     * @param _fieldId Field ID
     * @return fieldName Field name
     * @return pricePerHour Price per hour in Wei
     * @return isActive Whether field is active
     * @return totalBookings Total confirmed bookings
     * @return totalRevenue Total revenue from this field
     */
    function getFieldStats(uint256 _fieldId) external view onlyOwner fieldExists(_fieldId) returns (
        string memory fieldName,
        uint256 pricePerHour,
        bool isActive,
        uint256 totalBookings,
        uint256 totalRevenue
    ) {
        Field memory field = fields[_fieldId];

        return (
            field.name,
            field.pricePerHour,
            field.isActive,
            fieldBookingCount[_fieldId],
            fieldTotalRevenue[_fieldId]
        );
    }

    // ==================== CONTRACT INFO ====================

    /**
     * @dev Get contract stats
     */
    function getContractStats() external view returns (
        uint256 totalFields,
        uint256 totalBookings,
        uint256 contractETHBalance
    ) {
        return (fieldCounter, bookingCounter, contractBalance);
    }
}
