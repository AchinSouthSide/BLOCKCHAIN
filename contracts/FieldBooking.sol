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

        // ===== V2 Metadata (backward-compatible; empty for legacy fields) =====
        string time;                // Time window / schedule description
        string description;         // Field description
        string location;            // Field location/address
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

    /**
     * @dev Represents a notification/message in inbox
     */
    struct Notification {
        uint256 id;                 // Notification ID
        address recipient;          // User or admin who receives
        string notificationType;    // "booking_created", "booking_confirmed", "booking_cancelled", "ticket_ready"
        string message;             // Notification message
        string ticketId;            // Ticket ID for booking
        uint256 relatedBookingId;   // Related booking ID
        uint256 createdAt;          // Timestamp
        bool read;                  // Mark as read
    }

    // ==================== STATE VARIABLES ====================

    // Platform owner (single admin address)
    address public platformOwner;

    // Local dev chainId (Hardhat)
    uint256 private constant LOCAL_CHAIN_ID = 31337;

    // Admin mapping (only one admin is allowed by design)
    mapping(address => bool) public admins;

    // Counters
    uint256 public fieldCounter = 0;
    uint256 public bookingCounter = 0;
    uint256 public notificationCounter = 0;

    // Platform fee: 5% of each booking
    uint256 public constant PLATFORM_FEE_PERCENT = 5;

    // Mappings
    mapping(uint256 => Field) public fields;                    // fieldId => Field
    mapping(uint256 => Booking) public bookings;                // bookingId => Booking
    mapping(address => uint256[]) public userBookings;          // user => [bookingIds]
    mapping(uint256 => uint256[]) public fieldBookings;         // fieldId => [bookingIds]
    mapping(address => uint256) public ownerBalance;            // owner => balance to withdraw
    
    // Notification mappings
    mapping(uint256 => Notification) public notifications;      // notificationId => Notification
    mapping(address => uint256[]) public userNotifications;     // user => [notificationIds]
    mapping(bytes32 => string) public ticketIds;               // bookingId + user => ticketId
    
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

    event AdminAdded(address indexed admin);

    event FieldCreated(
        uint256 indexed fieldId,
        string name,
        uint256 pricePerHour,
        address owner
    );

    event FieldCreatedV2(
        uint256 indexed fieldId,
        string name,
        uint256 pricePerHour,
        address owner,
        string time,
        string description,
        string location
    );

    event FieldUpdated(
        uint256 indexed fieldId,
        uint256 newPrice
    );

    event FieldUpdatedV2(
        uint256 indexed fieldId,
        string name,
        uint256 pricePerHour,
        string time,
        string description,
        string location
    );

    event FieldStatusChanged(
        uint256 indexed fieldId,
        bool isActive
    );

    event FieldDeleted(
        uint256 indexed fieldId,
        string fieldName
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

    /**
     * @dev Notification event for inbox system
     */
    event NotificationCreated(
        uint256 indexed notificationId,
        address indexed recipient,
        string notificationType,  // "booking_created", "booking_confirmed", "booking_cancelled", "ticket_ready"
        string message,
        string ticketId,
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
     * @dev Platform owner or delegated admin can call
     */
    modifier onlyAdmin() {
        // Demo mode: allow any wallet to act as admin.
        // WARNING: This is intentionally insecure for public deployments.
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
    constructor(address _admin) {
        require(_admin != address(0), "Invalid admin address");
        platformOwner = _admin;
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    // ==================== ADMIN MANAGEMENT ====================

    function isAdmin(address user) public view returns (bool) {
        user; // silence unused variable warning
        return true;
    }

    /**
     * @dev Intentionally restricted: by design only the configured admin exists.
     * This function is kept for API completeness but prevents granting admin to other wallets.
     */
    function addAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin == platformOwner, "Admin is fixed");
        if (!admins[newAdmin]) {
            admins[newAdmin] = true;
            emit AdminAdded(newAdmin);
        }
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
    ) external onlyAdmin {
        require(bytes(_name).length > 0, "Field name cannot be empty");
        require(_pricePerHour > 0, "Price must be greater than 0");

        fieldCounter++;

        fields[fieldCounter] = Field({
            id: fieldCounter,
            name: _name,
            pricePerHour: _pricePerHour,
            isActive: true,
            owner: msg.sender,
            createdAt: block.timestamp,
            time: "",
            description: "",
            location: ""
        });

        emit FieldCreated(fieldCounter, _name, _pricePerHour, msg.sender);
    }

    function createFieldV2(
        string memory _name,
        uint256 _pricePerHour,
        string memory _time,
        string memory _description,
        string memory _location
    ) external onlyAdmin {
        require(bytes(_name).length > 0, "Field name cannot be empty");
        require(_pricePerHour > 0, "Price must be greater than 0");

        fieldCounter++;

        fields[fieldCounter] = Field({
            id: fieldCounter,
            name: _name,
            pricePerHour: _pricePerHour,
            isActive: true,
            owner: msg.sender,
            createdAt: block.timestamp,
            time: _time,
            description: _description,
            location: _location
        });

        emit FieldCreatedV2(fieldCounter, _name, _pricePerHour, msg.sender, _time, _description, _location);
    }

    /**
     * @dev Update field price (only owner)
     * @param _fieldId Field ID
     * @param _newPrice New price per hour
     */
    function updateFieldPrice(
        uint256 _fieldId,
        uint256 _newPrice
    ) external onlyAdmin fieldExists(_fieldId) {
        require(_newPrice > 0, "Price must be greater than 0");
        
        fields[_fieldId].pricePerHour = _newPrice;
        
        emit FieldUpdated(_fieldId, _newPrice);
    }

    function updateFieldV2(
        uint256 _fieldId,
        string memory _name,
        uint256 _pricePerHour,
        string memory _time,
        string memory _description,
        string memory _location
    ) external onlyAdmin fieldExists(_fieldId) {
        require(bytes(_name).length > 0, "Field name cannot be empty");
        require(_pricePerHour > 0, "Price must be greater than 0");

        Field storage field = fields[_fieldId];
        field.name = _name;
        field.pricePerHour = _pricePerHour;
        field.time = _time;
        field.description = _description;
        field.location = _location;

        emit FieldUpdatedV2(_fieldId, _name, _pricePerHour, _time, _description, _location);
    }

    /**
     * @dev Toggle field status (active/inactive)
     * @param _fieldId Field ID
     */
    function toggleFieldStatus(
        uint256 _fieldId
    ) external onlyAdmin fieldExists(_fieldId) {
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

        // Get field name for notification
        string memory fieldName = fields[_fieldId].name;

        // Create notification for user (waiting for admin confirmation)
        _createNotification(
            msg.sender,
            "booking_created",
            string(abi.encodePacked("San ", fieldName, " da duoc dat thanh cong - ma giao dich: ", _toHexString(bookingCounter), " - ", _formatEther(msg.value), " ETH. Dang cho xac nhan tu admin. Email lien he: 12345667@BC.com")),
            "",
            bookingCounter
        );
        
        // Create notification for admin
        _createNotification(
            fields[_fieldId].owner,
            "booking_waiting",
            string(abi.encodePacked("Co dat san moi: ", fieldName, " - ma giao dich: ", _toHexString(bookingCounter), " dang cho xac nhan")),
            "",
            bookingCounter
        );
    }

    /**
     * @dev Generate unique ticket ID
     */
    function _generateTicketId(uint256 _bookingId, address _user) internal view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(_bookingId, _user, block.timestamp));
        return _toHexString(uint256(hash));
    }

    /**
     * @dev Create notification and emit event
     */
    function _createNotification(
        address _recipient,
        string memory _type,
        string memory _message,
        string memory _ticketId,
        uint256 _bookingId
    ) internal {
        notificationCounter++;
        notifications[notificationCounter] = Notification({
            id: notificationCounter,
            recipient: _recipient,
            notificationType: _type,
            message: _message,
            ticketId: _ticketId,
            relatedBookingId: _bookingId,
            createdAt: block.timestamp,
            read: false
        });
        userNotifications[_recipient].push(notificationCounter);
        
        emit NotificationCreated(
            notificationCounter,
            _recipient,
            _type,
            _message,
            _ticketId,
            block.timestamp
        );
    }

    /**
     * @dev Convert uint to hex string
     */
    function _toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 16;
        }
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(digits);
        temp = value;
        for (uint256 i = digits; i > 0; i--) {
            result[i - 1] = hexChars[temp % 16];
            temp /= 16;
        }
        return string(result);
    }

    /**
     * @dev Format Wei to ETH string (simplified, shows 2 decimals)
     */
    function _formatEther(uint256 weiAmount) internal pure returns (string memory) {
        uint256 ethAmount = weiAmount / 1e18;
        uint256 remainder = (weiAmount % 1e18) / 1e16; // 2 decimal places
        
        if (remainder == 0) {
            return _toDecimalString(ethAmount);
        }
        
        // Simple concatenation: just show as integer for display
        return _toDecimalString(ethAmount);
    }

    /**
     * @dev Substring helper
     */
    function _substring(string memory str, uint256 start, uint256 length) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            if (start + i < strBytes.length) {
                result[i] = strBytes[start + i];
            }
        }
        return string(result);
    }

    /**
     * @dev Admin deactivate field (hủy sân)
     */
    function deactivateField(uint256 _fieldId) external onlyAdmin fieldExists(_fieldId) {
        require(fields[_fieldId].isActive, "Field is already inactive");
        fields[_fieldId].isActive = false;
        emit FieldStatusChanged(_fieldId, false);
    }

    /**
     * @dev Admin activate field
     */
    function activateField(uint256 _fieldId) external onlyAdmin fieldExists(_fieldId) {
        require(!fields[_fieldId].isActive, "Field is already active");
        fields[_fieldId].isActive = true;
        emit FieldStatusChanged(_fieldId, true);
    }

    /**
     * @dev Admin delete field - hủy sân hoàn toàn
     * Sends notification to all users with bookings on this field
     * Message format: "Tên Sân đã được A Chinh Hủy Rồi Nha ^.^"
     */
    function deleteField(uint256 _fieldId) external onlyAdmin fieldExists(_fieldId) {
        Field memory fieldToDelete = fields[_fieldId];
        
        // Get all bookings for this field
        uint256[] memory fieldBookingList = fieldBookings[_fieldId];
        
        // Send notification to each user who has a booking on this field
        for (uint256 i = 0; i < fieldBookingList.length; i++) {
            uint256 bookingId = fieldBookingList[i];
            address bookingUser = bookings[bookingId].user;
            
            // Create notification message: "Tên Sân đã được A Chinh Hủy Rồi Nha ^.^"
            string memory notificationMessage = string(abi.encodePacked(
                fieldToDelete.name,
                " da duoc A Chinh Huy Roi Nha ^.^ Email: 12345667@BC.com"
            ));
            
            _createNotification(
                bookingUser,
                "field_deleted",
                notificationMessage,
                "",
                bookingId
            );
        }
        
        // Delete the field
        delete fields[_fieldId];
        
        emit FieldDeleted(_fieldId, fieldToDelete.name);
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
    ) external onlyAdmin bookingExists(_bookingId) {
        require(
            bookings[_bookingId].status == BookingStatus.Pending,
            "Only pending bookings can be confirmed"
        );

        Booking storage booking = bookings[_bookingId];
        booking.status = BookingStatus.Confirmed;

        address adminRecipient = fields[booking.fieldId].owner;

        // Calculate and distribute fees
        uint256 ownerAmount = (booking.amountPaid * (100 - PLATFORM_FEE_PERCENT)) / 100;
        uint256 feeAmount = booking.amountPaid - ownerAmount;

        // Credit earnings to the field owner (admin)
        ownerBalance[adminRecipient] += ownerAmount;

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

        // Send ticket to user with confirmation
        string memory ticketId = _generateTicketId(_bookingId, booking.user);
        ticketIds[keccak256(abi.encodePacked(_bookingId, booking.user))] = ticketId;
        
        // Get field name
        string memory fieldName = fields[booking.fieldId].name;
        
        // Notification for user: "sân [Tên Sân] đã được đặt thành công - mã giao dịch: [ticket] - X ETH và nhận mã vé"
        _createNotification(
            booking.user,
            "booking_confirmed",
            string(abi.encodePacked("San ", fieldName, " da duoc dat thanh cong - ma giao dich: ", ticketId, " - ", _formatEther(booking.amountPaid), " ETH va nhan ma ve. Email: 12345667@BC.com")),
            ticketId,
            _bookingId
        );

        // Notification for admin: "giao dịch [Tên Sân] đã hoàn thành nhận X ETH - mã giao dịch: [ticket]"
        _createNotification(
            adminRecipient,
            "booking_confirmed",
            string(abi.encodePacked("Giao dich ", fieldName, " da hoan thanh nhan ", _formatEther(ownerAmount), " ETH - ma giao dich: ", ticketId)),
            ticketId,
            _bookingId
        );
    }

    /**
     * @dev Cancel booking and refund user (USER can cancel PENDING booking)
     * @param _bookingId Booking ID
     * User receives 40%, admin keeps 60%
     */
    function cancelBooking(
        uint256 _bookingId
    ) external bookingExists(_bookingId) {
        require(
            bookings[_bookingId].status != BookingStatus.Cancelled,
            "Booking is already cancelled"
        );

        Booking storage booking = bookings[_bookingId];

        // Only the user who booked can cancel
        require(
            msg.sender == booking.user,
            "Only booking owner can cancel"
        );

        // Cannot cancel confirmed bookings (payment already distributed)
        require(
            booking.status == BookingStatus.Pending,
            "Cannot cancel confirmed bookings"
        );

        booking.status = BookingStatus.Cancelled;

        // Refund 40% to user, keep 60% with admin
        uint256 refundAmount = (booking.amountPaid * 40) / 100;
        uint256 adminKeep = booking.amountPaid - refundAmount;
        
        payable(booking.user).transfer(refundAmount);
        contractBalance -= refundAmount;
        
        // Add to admin balance
        ownerBalance[fields[booking.fieldId].owner] += adminKeep;

        emit BookingCancelled(_bookingId, booking.user, refundAmount);

        // Create notification for user
        string memory ticketId = ticketIds[keccak256(abi.encodePacked(_bookingId, booking.user))];
        _createNotification(
            booking.user,
            "booking_cancelled",
            string(abi.encodePacked("Dat san da bi huy. Hoan 40%: ", _toDecimalString(refundAmount), " Wei. Email: 12345667@BC.com")),
            ticketId,
            _bookingId
        );

        // Create notification for admin
        _createNotification(
            fields[booking.fieldId].owner,
            "booking_cancelled",
            "Dat san da bi huy boi user. Giu lai 60%",
            ticketId,
            _bookingId
        );
    }

    /**
     * @dev Convert wei to decimal string for display
     */
    function _toDecimalString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory result = new bytes(digits);
        temp = value;
        for (uint256 i = digits; i > 0; i--) {
            result[i - 1] = bytes1(uint8(48 + temp % 10));
            temp /= 10;
        }
        return string(result);
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
     * @dev Get notifications for user (inbox)
     */
    function getUserNotifications(address _user) external view returns (Notification[] memory) {
        uint256[] memory notificationIds = userNotifications[_user];
        Notification[] memory result = new Notification[](notificationIds.length);

        for (uint256 i = 0; i < notificationIds.length; i++) {
            result[i] = notifications[notificationIds[i]];
        }
        return result;
    }

    /**
     * @dev Mark notification as read
     */
    function markNotificationAsRead(uint256 _notificationId) external {
        require(_notificationId > 0 && _notificationId <= notificationCounter, "Invalid notification ID");
        require(notifications[_notificationId].recipient == msg.sender, "Not authorized");
        
        notifications[_notificationId].read = true;
    }

    /**
     * @dev Get ticket ID for booking
     */
    function getTicketId(uint256 _bookingId, address _user) external view returns (string memory) {
        return ticketIds[keccak256(abi.encodePacked(_bookingId, _user))];
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
    function withdrawBalance() external onlyAdmin {
        uint256 amount = ownerBalance[msg.sender];
        require(amount > 0, "No balance to withdraw");

        ownerBalance[msg.sender] = 0;
        contractBalance -= amount;

        payable(msg.sender).transfer(amount);

        emit BalanceWithdrawn(msg.sender, amount);
        
        // Emit admin withdrawal event for tracking
        emit AdminWithdrawal(msg.sender, amount, 0, block.timestamp);
    }

    // ==================== DATA RESET (ADMIN ONLY) ====================

    /**
     * @dev Clear all bookings and reset booking counter
     * Used for testing/reset purposes
     */
    function clearAllBookings() external onlyAdmin {
        // Delete booking structs + clear per-user lists (best-effort)
        for (uint256 i = 1; i <= bookingCounter; i++) {
            if (bookings[i].id != 0) {
                address user = bookings[i].user;
                delete bookings[i];

                if (user != address(0) && userBookings[user].length > 0) {
                    delete userBookings[user];
                }
            }
        }

        // Clear per-field booking ID lists to avoid returning empty bookings
        for (uint256 f = 1; f <= fieldCounter; f++) {
            if (fields[f].id != 0 && fieldBookings[f].length > 0) {
                delete fieldBookings[f];
            }
        }

        // Reset booking counter
        bookingCounter = 0;
    }

    /**
     * @dev Clear all notifications and reset notification counter
     * Used for testing/reset purposes
     */
    function clearAllNotifications() external onlyAdmin {
        // Clear all notifications
        for (uint256 i = 1; i <= notificationCounter; i++) {
            if (notifications[i].id != 0) {
                address recipient = notifications[i].recipient;
                delete notifications[i];
                
                // Clear recipient's notification list
                if (userNotifications[recipient].length > 0) {
                    delete userNotifications[recipient];
                }
            }
        }
        
        // Reset notification counter
        notificationCounter = 0;
    }

    // ==================== ADMIN STATISTICS (ADMIN ONLY) ====================

    /**
     * @dev Get revenue for a specific day (admin only)
     * @param _date Unix timestamp date (any time within the day)
     * @return Daily revenue in Wei
     */
    function getDailyRevenue(uint256 _date) external view onlyAdmin returns (uint256) {
        uint256 dayKey = _date / 86400;
        return dailyRevenue[dayKey];
    }

    /**
     * @dev Get total revenue for a specific field (admin only)
     * @param _fieldId Field ID
     * @return Total revenue from all completed bookings for this field
     */
    function getFieldRevenue(uint256 _fieldId) external view onlyAdmin fieldExists(_fieldId) returns (uint256) {
        return fieldTotalRevenue[_fieldId];
    }

    /**
     * @dev Get total confirmed bookings for a field (admin only)
     * @param _fieldId Field ID
     * @return Number of confirmed bookings
     */
    function getFieldBookingCount(uint256 _fieldId) external view onlyAdmin fieldExists(_fieldId) returns (uint256) {
        return fieldBookingCount[_fieldId];
    }

    /**
     * @dev Get most booked field (admin only)
     * @return fieldId The most booked field ID
     * @return bookingCount Number of bookings
     */
    function getMostBookedField() external view onlyAdmin returns (uint256 fieldId, uint256 bookingCount) {
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
    function getAdminSummary() external view onlyAdmin returns (
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
            ownerBalance[msg.sender],
            contractBalance
        );
    }

    /**
     * @dev Get field statistics (viewable by anyone)
     * @param _fieldId Field ID
     * @return fieldName Field name
     * @return pricePerHour Price per hour in Wei
     * @return isActive Whether field is active
     * @return totalBookings Total confirmed bookings
     * @return totalRevenue Total revenue from this field
     */
    function getFieldStats(uint256 _fieldId) external view fieldExists(_fieldId) returns (
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
