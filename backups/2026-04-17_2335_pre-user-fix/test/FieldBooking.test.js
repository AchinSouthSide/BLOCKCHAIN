const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('FieldBooking Smart Contract (current API)', function () {
  let fieldBooking;
  let owner, user1, user2;

  const PRICE_PER_HOUR = ethers.parseEther('0.1');

  async function deploy() {
    const Factory = await ethers.getContractFactory('FieldBooking');
    const contract = await Factory.deploy();
    return contract;
  }

  async function latestTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return Number(block.timestamp);
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    fieldBooking = await deploy();
  });

  describe('Field Management (admin-only)', function () {
    it('Owner can create a field', async function () {
      await expect(fieldBooking.createField('San A', PRICE_PER_HOUR))
        .to.emit(fieldBooking, 'FieldCreated')
        .withArgs(1, 'San A', PRICE_PER_HOUR, owner.address);

      const field = await fieldBooking.getField(1);
      expect(field.id).to.equal(1);
      expect(field.name).to.equal('San A');
      expect(field.pricePerHour).to.equal(PRICE_PER_HOUR);
      expect(field.isActive).to.equal(true);
      expect(field.owner).to.equal(owner.address);
    });

    it('Non-owner cannot create a field', async function () {
      await expect(fieldBooking.connect(user1).createField('San A', PRICE_PER_HOUR))
        .to.be.revertedWith('Only owner can call this');
    });

    it('Create field validates name and price', async function () {
      await expect(fieldBooking.createField('', PRICE_PER_HOUR))
        .to.be.revertedWith('Field name cannot be empty');
      await expect(fieldBooking.createField('San A', 0))
        .to.be.revertedWith('Price must be greater than 0');
    });

    it('Owner can update field price', async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);

      const newPrice = ethers.parseEther('0.15');
      await expect(fieldBooking.updateFieldPrice(1, newPrice))
        .to.emit(fieldBooking, 'FieldUpdated')
        .withArgs(1, newPrice);

      const field = await fieldBooking.getField(1);
      expect(field.pricePerHour).to.equal(newPrice);
    });

    it('Update price is owner-only and requires > 0', async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);

      await expect(fieldBooking.connect(user1).updateFieldPrice(1, PRICE_PER_HOUR))
        .to.be.revertedWith('Only owner can call this');

      await expect(fieldBooking.updateFieldPrice(1, 0))
        .to.be.revertedWith('Price must be greater than 0');
    });

    it('Owner can toggle field status', async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);

      await expect(fieldBooking.toggleFieldStatus(1))
        .to.emit(fieldBooking, 'FieldStatusChanged')
        .withArgs(1, false);

      let field = await fieldBooking.getField(1);
      expect(field.isActive).to.equal(false);

      await expect(fieldBooking.toggleFieldStatus(1))
        .to.emit(fieldBooking, 'FieldStatusChanged')
        .withArgs(1, true);

      field = await fieldBooking.getField(1);
      expect(field.isActive).to.equal(true);
    });
  });

  describe('Booking Management', function () {
    beforeEach(async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);
    });

    it('User can book an active field with correct payment', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600; // 2 hours
      const required = PRICE_PER_HOUR * 2n;

      await expect(
        fieldBooking.connect(user1).bookField(1, start, end, { value: required })
      ).to.emit(fieldBooking, 'BookingCreated');

      const booking = await fieldBooking.bookings(1);
      expect(booking.id).to.equal(1);
      expect(booking.fieldId).to.equal(1);
      expect(booking.user).to.equal(user1.address);
      expect(booking.startTime).to.equal(start);
      expect(booking.endTime).to.equal(end);
      expect(booking.amountPaid).to.equal(required);
      expect(booking.status).to.equal(0); // Pending
    });

    it('Booking rejects insufficient payment', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;

      await expect(
        fieldBooking.connect(user1).bookField(1, start, end, { value: ethers.parseEther('0.05') })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('Booking rejects past start time', async function () {
      const now = await latestTimestamp();
      const start = now - 10;
      const end = start + 3600;

      await expect(
        fieldBooking.connect(user1).bookField(1, start, end, { value: PRICE_PER_HOUR })
      ).to.be.revertedWith('Start time must be in future');
    });

    it('Detects time conflicts', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;
      const required = PRICE_PER_HOUR * 2n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });

      await expect(
        fieldBooking.connect(user2).bookField(1, start + 1800, end + 1800, { value: required })
      ).to.be.revertedWith('Time slot is already booked');
    });

    it('Admin can confirm booking; non-admin cannot', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;
      const required = PRICE_PER_HOUR * 2n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });

      await expect(fieldBooking.connect(user2).confirmBooking(1))
        .to.be.revertedWith('Only owner can call this');

      await expect(fieldBooking.confirmBooking(1))
        .to.emit(fieldBooking, 'BookingConfirmed');

      const booking = await fieldBooking.bookings(1);
      expect(booking.status).to.equal(1); // Confirmed
    });

    it('User can cancel a pending booking and gets refunded', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;
      const required = PRICE_PER_HOUR * 2n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });

      await expect(fieldBooking.connect(user1).cancelBooking(1))
        .to.emit(fieldBooking, 'BookingCancelled')
        .withArgs(1, user1.address, required);

      const booking = await fieldBooking.bookings(1);
      expect(booking.status).to.equal(2); // Cancelled

      // Once cancelled, conflict should no longer apply
      await expect(
        fieldBooking.connect(user2).bookField(1, start + 1800, end + 1800, { value: required })
      ).to.emit(fieldBooking, 'BookingCreated');
    });

    it('Cannot cancel a confirmed booking', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;
      const required = PRICE_PER_HOUR * 2n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });
      await fieldBooking.confirmBooking(1);

      await expect(fieldBooking.connect(user1).cancelBooking(1))
        .to.be.revertedWith('Cannot cancel confirmed bookings');
    });
  });

  describe('Withdrawals (admin-only)', function () {
    it('Owner can withdraw after confirming booking', async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);

      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;
      const required = PRICE_PER_HOUR * 2n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });
      await fieldBooking.confirmBooking(1);

      const bal = await fieldBooking.getBalance(owner.address);
      expect(bal).to.be.gt(0n);

      await expect(fieldBooking.withdrawBalance())
        .to.emit(fieldBooking, 'BalanceWithdrawn');

      const balAfter = await fieldBooking.getBalance(owner.address);
      expect(balAfter).to.equal(0n);
    });
  });
});
