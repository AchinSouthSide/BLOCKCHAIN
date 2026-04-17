const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🚀 FieldBooking DApp - Production Deployment Script");
  console.log("=====================================================\n");

  // Get all accounts
  const [deployer, fieldOwner1, fieldOwner2, user1, user2, user3] = 
    await hre.ethers.getSigners();

  console.log("📝 Accounts:");
  console.log(`  Platform Owner: ${deployer.address}`);
  console.log(`  Field Owner 1:  ${fieldOwner1.address}`);
  console.log(`  Field Owner 2:  ${fieldOwner2.address}`);
  console.log(`  User 1:         ${user1.address}`);
  console.log(`  User 2:         ${user2.address}`);
  console.log(`  User 3:         ${user3.address}\n`);

  // Get account balances
  console.log("💰 Initial Balances:");
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Platform Owner: ${hre.ethers.formatEther(deployerBalance)} ETH\n`);

  // ========== DEPLOY CONTRACT ==========
  console.log("📦 Deploying FieldBooking Contract...");
  const FieldBooking = await hre.ethers.getContractFactory("FieldBooking");
  const fieldBooking = await FieldBooking.deploy();
  await fieldBooking.waitForDeployment();
  const contractAddress = await fieldBooking.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}\n`);

  // ========== CREATE TEST DATA ==========
  console.log("📋 Creating Test Data...\n");

  const pricePerHour = hre.ethers.parseEther("0.1"); // 0.1 ETH per hour

  // Create Fields
  console.log("🏟️  Creating Fields:");
  
  const field1Tx = await fieldBooking.connect(deployer).createField(
    "Sân Bóng Đá 5 Người",
    pricePerHour
  );
  await field1Tx.wait();
  console.log(`  ✓ Field 1: Sân Bóng Đá 5 Người (0.1 ETH/hour)`);

  const field2Tx = await fieldBooking.connect(deployer).createField(
    "Sân Bóng Rổ",
    hre.ethers.parseEther("0.08")
  );
  await field2Tx.wait();
  console.log(`  ✓ Field 2: Sân Bóng Rổ (0.08 ETH/hour)`);

  const field3Tx = await fieldBooking.connect(deployer).createField(
    "Sân Cầu Lông",
    hre.ethers.parseEther("0.12")
  );
  await field3Tx.wait();
  console.log(`  ✓ Field 3: Sân Cầu Lông (0.12 ETH/hour)\n`);

  // Create Booking
  console.log("📅 Creating Test Booking:");
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 3600; // 1 hour from now
  const endTime = startTime + 7200; // 2 hours duration
  
  // Book field (will be in Pending state)
  const bookingAmount = hre.ethers.parseEther("0.1") * BigInt(2); // 2 hours at 0.1 ETH/hour
  const bookingTx = await fieldBooking.connect(user1).bookField(
    1, // fieldId
    startTime,
    endTime,
    { value: bookingAmount }
  );
  await bookingTx.wait();
  console.log(`  ✓ User1 booked Field 1 for 2 hours (${hre.ethers.formatEther(bookingAmount)} ETH)\n`);

  // Confirm booking
  console.log("✅ Confirming Booking:");
  const confirmTx = await fieldBooking.connect(deployer).confirmBooking(1);
  await confirmTx.wait();
  console.log(`  ✓ Admin confirmed booking #1\n`);

  // ========== VERIFY PAYMENT DISTRIBUTION ==========
  console.log("💸 Payment Distribution (5% platform fee):");
  const ownerBalance = await fieldBooking.ownerBalance(deployer.address);
  console.log(`  Owner balance: ${hre.ethers.formatEther(ownerBalance)} ETH`);
  console.log(`  Platform fee: ${hre.ethers.formatEther(bookingAmount * BigInt(5) / BigInt(100))} ETH\n`);

  // ========== SAVE DEPLOYMENT DATA ==========
  const deploymentData = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
    accounts: {
      platformOwner: deployer.address,
      fieldOwner1: fieldOwner1.address,
      fieldOwner2: fieldOwner2.address,
      user1: user1.address,
      user2: user2.address,
      user3: user3.address,
    },
    testData: {
      fields: {
        field1: { name: "Sân Bóng Đá 5 Người", pricePerHour: "0.1 ETH" },
        field2: { name: "Sân Bóng Rổ", pricePerHour: "0.08 ETH" },
        field3: { name: "Sân Cầu Lông", pricePerHour: "0.12 ETH" },
      },
      bookings: {
        booking1: {
          user: user1.address,
          fieldId: 1,
          amount: hre.ethers.formatEther(bookingAmount) + " ETH",
          status: "Confirmed",
        },
      },
    },
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentData, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2)
  );
  console.log("💾 Deployment saved to deployment.json\n");

  // ========== CONTRACT INFO ==========
  console.log("📊 Contract State:");
  const [totalFields, totalBookings, contractBalance] = await fieldBooking.getContractStats();
  console.log(`  Total Fields: ${totalFields}`);
  console.log(`  Total Bookings: ${totalBookings}`);
  console.log(`  Contract Balance: ${hre.ethers.formatEther(contractBalance)} ETH`);

  // ========== SETUP INSTRUCTIONS ==========
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📌 Business Flow:");
  console.log("  1. Admin creates field (pricePerHour set)");
  console.log("  2. User books field with ETH payment");
  console.log("  3. Booking enters PENDING state");
  console.log("  4. Admin confirms booking");
  console.log("  5. Payment distributed: 95% to admin, 5% platform fee");
  console.log("  6. Admin withdraws balance anytime");
  console.log("\n📱 Frontend Setup:");
  console.log("  1. Hardhat network in MetaMask:");
  console.log("     - URL: http://127.0.0.1:8545");
  console.log("     - Chain ID: 31337");
  console.log("     - Currency: ETH");
  console.log("\n  2. Import test account private keys from hardhat node logs");
  console.log("\n  3. Start frontend:");
  console.log("     cd frontend && npm start");
  console.log("\n  4. Open http://localhost:3000");
  console.log("\n✨ Contract Address (.env file):");
  console.log(`   REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
