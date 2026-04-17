const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FieldBooking Smart Contract", function () {
  let fieldBooking;
  let owner, fieldOwner, user1, user2;
  let fieldId = 1;
  let bookingId = 1;

  const PRICE_PER_HOUR = ethers.parseEther("0.1");
  const BOOKING_HOURS = 2;
  const TOTAL_PRICE = PRICE_PER_HOUR * BigInt(BOOKING_HOURS);

  beforeEach(async function () {
    [owner, fieldOwner, user1, user2] = await ethers.getSigners();

    // Deploy contract
    const FieldBookingFactory = await ethers.getContractFactory("FieldBooking");
    fieldBooking = await FieldBookingFactory.deploy();
  });

  describe("Field Creation", function () {
    it("Should create a field successfully", async function () {
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );

      const field = await fieldBooking.getField(1);
      expect(field.name).to.equal("Sân bóng đá A");
      expect(field.owner).to.equal(fieldOwner.address);
      expect(field.pricePerHour).to.equal(PRICE_PER_HOUR);
      expect(field.isActive).to.be.true;
    });

    it("Should emit FieldCreated event", async function () {
      await expect(
        fieldBooking
          .connect(fieldOwner)
          .createField(
            "Sân bóng đá A",
            "123 Đường ABC, TP HCM",
            "Sân bóng 5 người",
            PRICE_PER_HOUR
          )
      )
        .to.emit(fieldBooking, "FieldCreated")
        .withArgs(1, "Sân bóng đá A", fieldOwner.address);
    });

    it("Should fail if price is 0", async function () {
      await expect(
        fieldBooking
          .connect(fieldOwner)
          .createField("Sân bóng đá A", "123 Đường ABC, TP HCM", "Sân bóng 5 người", 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should fail if name is empty", async function () {
      await expect(
        fieldBooking
          .connect(fieldOwner)
          .createField("", "123 Đường ABC, TP HCM", "Sân bóng 5 người", PRICE_PER_HOUR)
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Field Update", function () {
    beforeEach(async function () {
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );
    });

    it("Should update field successfully", async function () {
      const newPrice = ethers.parseEther("0.15");
      await fieldBooking
        .connect(fieldOwner)
        .updateField(
          1,
          "Sân bóng đá A - Updated",
          "456 Đường XYZ",
          "Sân bóng 11 người",
          newPrice
        );

      const field = await fieldBooking.getField(1);
      expect(field.name).to.equal("Sân bóng đá A - Updated");
      expect(field.pricePerHour).to.equal(newPrice);
    });

    it("Should not allow non-owner to update field", async function () {
      await expect(
        fieldBooking.connect(user1).updateField(
          1,
          "Sân bóng đá A - Updated",
          "456 Đường XYZ",
          "Sân bóng 11 người",
          PRICE_PER_HOUR
        )
      ).to.be.revertedWith("Only field owner can call this");
    });
  });

  describe("Booking Creation", function () {
    beforeEach(async function () {
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );
    });

    it("Should create booking successfully", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
      const endTime = startTime + 2 * 3600; // 2 hours later

      const tx = await fieldBooking
        .connect(user1)
        .createBooking(1, startTime, endTime, { value: TOTAL_PRICE });

      const booking = await fieldBooking.getBooking(1);
      expect(booking.fieldId).to.equal(1);
      expect(booking.user).to.equal(user1.address);
      expect(booking.status).to.equal(0); // Pending
      expect(booking.totalPrice).to.equal(TOTAL_PRICE);
    });

    it("Should emit BookingCreated event", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 86400;
      const endTime = startTime + 2 * 3600;

      await expect(
        fieldBooking
          .connect(user1)
          .createBooking(1, startTime, endTime, { value: TOTAL_PRICE })
      ).to.emit(fieldBooking, "BookingCreated");
    });

    it("Should fail if booking in the past", async function () {
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const endTime = startTime + 2 * 3600;

      await expect(
        fieldBooking
          .connect(user1)
          .createBooking(1, startTime, endTime, { value: TOTAL_PRICE })
      ).to.be.revertedWith("Start time must be in the future");
    });

    it("Should fail if insufficient payment", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 86400;
      const endTime = startTime + 2 * 3600;

      await expect(
        fieldBooking
          .connect(user1)
          .createBooking(1, startTime, endTime, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should detect time conflicts", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 86400;
      const endTime = startTime + 2 * 3600;

      // Create first booking
      await fieldBooking
        .connect(user1)
        .createBooking(1, startTime, endTime, { value: TOTAL_PRICE });

      // Try to create overlapping booking
      await expect(
        fieldBooking
          .connect(user2)
          .createBooking(1, startTime + 1800, endTime + 1800, { value: TOTAL_PRICE })
      ).to.be.revertedWith("Time slot is already booked");
    });
  });

  describe("Booking Confirmation", function () {
    let startTime, endTime;

    beforeEach(async function () {
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );

      startTime = Math.floor(Date.now() / 1000) + 86400;
      endTime = startTime + 2 * 3600;

      await fieldBooking
        .connect(user1)
        .createBooking(1, startTime, endTime, { value: TOTAL_PRICE });
    });

    it("Should confirm booking", async function () {
      await fieldBooking.connect(fieldOwner).confirmBooking(1);

      const booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(1); // Confirmed
    });

    it("Should emit BookingConfirmed event", async function () {
      await expect(fieldBooking.connect(fieldOwner).confirmBooking(1))
        .to.emit(fieldBooking, "BookingConfirmed")
        .withArgs(1);
    });

    it("Should not allow non-owner to confirm", async function () {
      await expect(
        fieldBooking.connect(user2).confirmBooking(1)
      ).to.be.revertedWith("Only field owner can confirm booking");
    });
  });

  describe("Check-in", function () {
    let startTime, endTime;

    beforeEach(async function () {
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );

      startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      endTime = startTime + 2 * 3600; // 2 hours booking

      await fieldBooking
        .connect(user1)
        .createBooking(1, startTime, endTime, { value: TOTAL_PRICE });

      // Confirm booking
      await fieldBooking.connect(fieldOwner).confirmBooking(1);

      // Advance time to start time
      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
      await ethers.provider.send("evm_mine");
    });

    it("Should check-in successfully", async function () {
      await fieldBooking.connect(user1).checkIn(1);

      const booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(2); // Checked-in
    });

    it("Should emit CheckinCompleted event", async function () {
      await expect(fieldBooking.connect(user1).checkIn(1))
        .to.emit(fieldBooking, "CheckinCompleted")
        .withArgs(1);
    });
  });

  describe("Refund", function () {
    let startTime, endTime;

    beforeEach(async function () {
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );

      startTime = Math.floor(Date.now() / 1000) + 86400;
      endTime = startTime + 2 * 3600;

      await fieldBooking
        .connect(user1)
        .createBooking(1, startTime, endTime, { value: TOTAL_PRICE });
    });

    it("Should refund pending booking", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      await fieldBooking.connect(user1).refundBooking(1);

      const booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(5); // Refunded
    });

    it("Should emit RefundProcessed event", async function () {
      await expect(fieldBooking.connect(user1).refundBooking(1))
        .to.emit(fieldBooking, "RefundProcessed")
        .withArgs(1, TOTAL_PRICE);
    });
  });

  describe("Integration Test - Full Flow", function () {
    it("Complete flow: Create field -> Book -> Confirm -> Check-in -> Complete Booking", async function () {
      // 1. Create field
      await fieldBooking
        .connect(fieldOwner)
        .createField(
          "Sân bóng đá A",
          "123 Đường ABC, TP HCM",
          "Sân bóng 5 người",
          PRICE_PER_HOUR
        );

      // 2. Create booking
      const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const endTime = startTime + 2 * 3600;

      await fieldBooking
        .connect(user1)
        .createBooking(1, startTime, endTime, { value: TOTAL_PRICE });

      let booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(0); // Pending

      // 3. Confirm booking
      await fieldBooking.connect(fieldOwner).confirmBooking(1);
      booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(1); // Confirmed

      // 4. Advance to check-in time
      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]);
      await ethers.provider.send("evm_mine");

      // 5. Check-in
      await fieldBooking.connect(user1).checkIn(1);
      booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(2); // Checked-in

      // 6. Complete booking (wait for end time)
      await ethers.provider.send("evm_setNextBlockTimestamp", [endTime]);
      await ethers.provider.send("evm_mine");
      // For testing, we'll just move forward in time using hardhat
      await ethers.provider.send("evm_increaseTime", [7200]); // 2 hours
      await ethers.provider.send("evm_mine"); // Mine a new block

      await fieldBooking.connect(user1).completeBooking(1);
      booking = await fieldBooking.getBooking(1);
      expect(booking.status).to.equal(3); // Completed
    });
  });
});
