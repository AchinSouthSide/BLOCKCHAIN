const { expect } = require('chai');
const { ethers } = require('hardhat');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');

describe('FieldBooking Smart Contract (current API)', function () {
  let fieldBooking;
  let owner, user1, user2;

  const PRICE_PER_HOUR = ethers.parseEther('0.1');

  async function deploy(adminAddress = null) {
    const Factory = await ethers.getContractFactory('FieldBooking');
    const contract = await Factory.deploy(adminAddress || owner.address);
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

  it('Admin is provided at deploy (not forced to deployer)', async function () {
    const contract = await deploy(user1.address);
    expect(await contract.platformOwner()).to.equal(user1.address);
    expect(await contract.admins(user1.address)).to.equal(true);
    expect(await contract.admins(owner.address)).to.equal(false);

    // Demo mode: any wallet can create fields
    await expect(contract.createField('San A', PRICE_PER_HOUR))
      .to.emit(contract, 'FieldCreated');

    await expect(contract.connect(user1).createField('San B', PRICE_PER_HOUR))
      .to.emit(contract, 'FieldCreated');
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
      expect(field.time).to.equal('');
      expect(field.description).to.equal('');
      expect(field.location).to.equal('');
    });

    it('Any wallet can create a field (demo admin mode)', async function () {
      await expect(fieldBooking.connect(user1).createField('San A', PRICE_PER_HOUR))
        .to.emit(fieldBooking, 'FieldCreated')
        .withArgs(1, 'San A', PRICE_PER_HOUR, user1.address);
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

    it('Update price works in demo admin mode and requires > 0', async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);

      const newPrice = ethers.parseEther('0.12');
      await expect(fieldBooking.connect(user1).updateFieldPrice(1, newPrice))
        .to.emit(fieldBooking, 'FieldUpdated')
        .withArgs(1, newPrice);

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

    it('Admin can create and update field with V2 metadata', async function () {
      await expect(
        fieldBooking.createFieldV2(
          'San V2',
          PRICE_PER_HOUR,
          '09:00-22:00',
          'San co nhan tao',
          '123 Nguyen Trai, Q1'
        )
      )
        .to.emit(fieldBooking, 'FieldCreatedV2')
        .withArgs(1, 'San V2', PRICE_PER_HOUR, owner.address, '09:00-22:00', 'San co nhan tao', '123 Nguyen Trai, Q1');

      const field = await fieldBooking.getField(1);
      expect(field.name).to.equal('San V2');
      expect(field.time).to.equal('09:00-22:00');
      expect(field.description).to.equal('San co nhan tao');
      expect(field.location).to.equal('123 Nguyen Trai, Q1');

      const newPrice = ethers.parseEther('0.15');
      await expect(
        fieldBooking.updateFieldV2(1, 'San V2 Updated', newPrice, '10:00-21:00', 'Mo ta moi', '456 Le Loi')
      )
        .to.emit(fieldBooking, 'FieldUpdatedV2')
        .withArgs(1, 'San V2 Updated', newPrice, '10:00-21:00', 'Mo ta moi', '456 Le Loi');

      const fieldAfter = await fieldBooking.getField(1);
      expect(fieldAfter.name).to.equal('San V2 Updated');
      expect(fieldAfter.pricePerHour).to.equal(newPrice);
      expect(fieldAfter.time).to.equal('10:00-21:00');
      expect(fieldAfter.description).to.equal('Mo ta moi');
      expect(fieldAfter.location).to.equal('456 Le Loi');
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

    it('Booking transfers ETH into the contract (user pays, contract receives)', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600; // 2 hours
      const required = PRICE_PER_HOUR * 2n;

      const tx = await fieldBooking.connect(user1).bookField(1, start, end, { value: required });
      await tx.wait();

      // Internal accounting
      const stats = await fieldBooking.getContractStats();
      expect(stats.contractETHBalance).to.equal(required);

      // Actual on-chain ETH balance held by the contract
      const onChainBal = await ethers.provider.getBalance(fieldBooking.target);
      expect(onChainBal).to.equal(required);
    });

    it('Confirming booking increases admin withdrawable balance by 95%', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600; // 2 hours
      const required = PRICE_PER_HOUR * 2n;
      const ownerAmount = (required * 95n) / 100n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });

      await expect(fieldBooking.confirmBooking(1))
        .to.emit(fieldBooking, 'BookingPaymentReceived')
        .withArgs(1, 1, user1.address, required, ownerAmount, anyValue);

      const bal = await fieldBooking.getBalance(owner.address);
      expect(bal).to.equal(ownerAmount);
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

    it('Any wallet can confirm booking (demo admin mode)', async function () {
      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600;
      const required = PRICE_PER_HOUR * 2n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });

      await expect(fieldBooking.connect(user2).confirmBooking(1))
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

      // User gets 40% refund
      const expectedRefund = (required * 40n) / 100n;

      await expect(fieldBooking.connect(user1).cancelBooking(1))
        .to.emit(fieldBooking, 'BookingCancelled')
        .withArgs(1, user1.address, expectedRefund);

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

    it('Other wallets cannot become admin', async function () {
      await expect(fieldBooking.connect(user1).addAdmin(user1.address))
        .to.be.revertedWith('Admin is fixed');

      await expect(fieldBooking.addAdmin(user2.address))
        .to.be.revertedWith('Admin is fixed');

      // Mapping stays fixed, but demo-mode isAdmin returns true for everyone.
      expect(await fieldBooking.admins(user2.address)).to.equal(false);
      expect(await fieldBooking.isAdmin(user2.address)).to.equal(true);
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

    it('Withdraw transfers ETH from contract to admin wallet (minus gas)', async function () {
      await fieldBooking.createField('San A', PRICE_PER_HOUR);

      const now = await latestTimestamp();
      const start = now + 3600;
      const end = start + 2 * 3600; // 2 hours
      const required = PRICE_PER_HOUR * 2n;
      const ownerAmount = (required * 95n) / 100n;

      await fieldBooking.connect(user1).bookField(1, start, end, { value: required });
      await fieldBooking.confirmBooking(1);

      const ownerBalBefore = await ethers.provider.getBalance(owner.address);
      const contractBalBefore = await ethers.provider.getBalance(fieldBooking.target);
      expect(contractBalBefore).to.equal(required);

      const tx = await fieldBooking.withdrawBalance();
      const receipt = await tx.wait();
      const gasPrice = receipt.gasPrice ?? receipt.effectiveGasPrice;
      const gasCost = receipt.gasUsed * gasPrice;

      const ownerBalAfter = await ethers.provider.getBalance(owner.address);
      const contractBalAfter = await ethers.provider.getBalance(fieldBooking.target);

      expect(contractBalAfter).to.equal(contractBalBefore - ownerAmount);
      expect(ownerBalAfter).to.equal(ownerBalBefore + ownerAmount - gasCost);
    });
  });

  describe('Admin reset helpers (demo/testing)', function () {
    it('clearAllBookings clears field booking lists and resets counter', async function () {
      // Create a field
      await fieldBooking.createField('Sân Test', PRICE_PER_HOUR);

      // Create a booking
      const now = await latestTimestamp();
      const startTime = now + 3600;
      const endTime = startTime + 3600;
      await fieldBooking.connect(user1).bookField(1, startTime, endTime, { value: PRICE_PER_HOUR });

      // Sanity: field bookings has 1 entry
      const before = await fieldBooking.getFieldBookings(1);
      expect(before.length).to.equal(1);

      // Clear
      await fieldBooking.clearAllBookings();

      // After: field bookings should be empty
      const after = await fieldBooking.getFieldBookings(1);
      expect(after.length).to.equal(0);

      const stats = await fieldBooking.getContractStats();
      // totalBookings should be 0 after reset
      expect(stats.totalBookings).to.equal(0);
    });
  });
});
