const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 FieldBooking DApp - Production Deployment Script");
  console.log("=====================================================\n");

  // Get all accounts
  const [deployer, fieldOwner1, fieldOwner2, user1, user2, user3] = 
    await hre.ethers.getSigners();

  const adminAddressRaw = process.env.ADMIN_ADDRESS || process.env.DEPLOY_ADMIN;
  if (!adminAddressRaw) {
    throw new Error(
      'Missing ADMIN_ADDRESS (or DEPLOY_ADMIN). ' +
      'Admin must be provided explicitly when deploying.'
    );
  }
  const adminAddress = adminAddressRaw.trim();
  if (!hre.ethers.isAddress(adminAddress)) {
    throw new Error(`Invalid ADMIN_ADDRESS: ${adminAddress}`);
  }

  console.log("📝 Accounts:");
  console.log(`  Deployer:       ${deployer.address}`);
  console.log(`  Admin (param):  ${adminAddress}`);
  console.log(`  Field Owner 1:  ${fieldOwner1.address}`);
  console.log(`  Field Owner 2:  ${fieldOwner2.address}`);
  console.log(`  User 1:         ${user1.address}`);
  console.log(`  User 2:         ${user2.address}`);
  console.log(`  User 3:         ${user3.address}\n`);

  // Get account balances
  console.log("💰 Initial Balances:");
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Deployer: ${hre.ethers.formatEther(deployerBalance)} ETH\n`);

  const knownSigners = [deployer, fieldOwner1, fieldOwner2, user1, user2, user3];
  const adminSigner = knownSigners.find(
    (s) => String(s.address).toLowerCase() === String(adminAddress).toLowerCase()
  );

  // ========== DEPLOY CONTRACT ==========
  console.log("📦 Deploying FieldBooking Contract...");
  const FieldBooking = await hre.ethers.getContractFactory("FieldBooking");
  const fieldBooking = await FieldBooking.deploy(adminAddress);
  await fieldBooking.waitForDeployment();
  const contractAddress = await fieldBooking.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}\n`);

  // ========== CREATE TEST DATA ==========
  let bookingAmount = null;
  if (!adminSigner) {
    console.log(
      '⚠️ ADMIN_ADDRESS is not one of the local Hardhat signers. ' +
      'Skipping on-chain test data creation (fields/bookings) to avoid revert.'
    );
  } else {
    console.log("📋 Creating Test Data...\n");

  const pricePerHour = hre.ethers.parseEther("0.1"); // 0.1 ETH per hour

  // Create Fields
  console.log("🏟️  Creating Fields:");
  
  const field1Tx = await fieldBooking.connect(adminSigner).createField(
    "Sân Bóng Đá 5 Người",
    pricePerHour
  );
  await field1Tx.wait();
  console.log(`  ✓ Field 1: Sân Bóng Đá 5 Người (0.1 ETH/hour)`);

  const field2Tx = await fieldBooking.connect(adminSigner).createField(
    "Sân Bóng Rổ",
    hre.ethers.parseEther("0.08")
  );
  await field2Tx.wait();
  console.log(`  ✓ Field 2: Sân Bóng Rổ (0.08 ETH/hour)`);

  const field3Tx = await fieldBooking.connect(adminSigner).createField(
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
  bookingAmount = hre.ethers.parseEther("0.1") * BigInt(2); // 2 hours at 0.1 ETH/hour
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
  const confirmTx = await fieldBooking.connect(adminSigner).confirmBooking(1);
  await confirmTx.wait();
  console.log(`  ✓ Admin confirmed booking #1\n`);

  // ========== VERIFY PAYMENT DISTRIBUTION ==========
  console.log("💸 Payment Distribution (5% platform fee):");
  const ownerBalance = await fieldBooking.ownerBalance(adminAddress);
  console.log(`  Owner balance: ${hre.ethers.formatEther(ownerBalance)} ETH`);
  console.log(`  Platform fee: ${hre.ethers.formatEther(bookingAmount * BigInt(5) / BigInt(100))} ETH\n`);
  }

  // ========== SAVE DEPLOYMENT DATA ==========
  const deploymentData = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    contractAddress: contractAddress,
    adminAddress: adminAddress,
    deployedAt: new Date().toISOString(),
    accounts: {
      deployer: deployer.address,
      admin: adminAddress,
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
          amount: bookingAmount ? (hre.ethers.formatEther(bookingAmount) + " ETH") : null,
          status: bookingAmount ? "Confirmed" : "Skipped",
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

  // ========== SYNC FRONTEND ABI (LOCAL DEV) ==========
  try {
    const artifactPath = path.join(
      __dirname,
      '..',
      'artifacts',
      'contracts',
      'FieldBooking.sol',
      'FieldBooking.json'
    );
    const frontendAbiPath = path.join(
      __dirname,
      '..',
      'frontend',
      'src',
      'services',
      'abi',
      'FieldBooking.json'
    );

    const artifactRaw = fs.readFileSync(artifactPath, 'utf8');
    const artifact = JSON.parse(artifactRaw);

    const frontendArtifact = {
      contractName: artifact.contractName || 'FieldBooking',
      sourceName: artifact.sourceName || 'contracts/FieldBooking.sol',
      abi: artifact.abi,
    };

    fs.writeFileSync(frontendAbiPath, JSON.stringify(frontendArtifact, null, 2), { encoding: 'utf8' });
    console.log('✅ Frontend ABI synced:', frontendAbiPath);
  } catch (e) {
    console.warn('⚠️ Could not sync frontend ABI:', e?.message || e);
  }

  // ========== SYNC FRONTEND ENV (LOCAL DEV) ==========
  try {
    const chainId = Number(deploymentData.chainId);
    const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env.local");
    const envBody = [
      "# Auto-generated by scripts/deploy.js",
      `# ${new Date().toISOString()}`,
      "",
      `REACT_APP_CONTRACT_ADDRESS=${contractAddress}`,
      `REACT_APP_NETWORK_ID=${chainId}`,
      "",
    ].join("\n");

    fs.writeFileSync(frontendEnvPath, envBody, { encoding: "utf8" });
    console.log("✅ Frontend env synced:", frontendEnvPath);
  } catch (e) {
    console.warn("⚠️ Could not write frontend/.env.local:", e?.message || e);
  }

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
