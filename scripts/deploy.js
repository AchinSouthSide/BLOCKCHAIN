const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying FieldBooking contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy contract
  const FieldBooking = await hre.ethers.getContractFactory("FieldBooking");
  const fieldBooking = await FieldBooking.deploy();

  await fieldBooking.waitForDeployment();
  const deployedAddress = await fieldBooking.getAddress();

  console.log(`✅ FieldBooking deployed to: ${deployedAddress}`);

  // Save deployment address
  const deploymentData = {
    address: deployedAddress,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("📄 Deployment data saved to deployment.json");

  // Verify contract on Etherscan (if on Sepolia)
  if (hre.network.name === "sepolia") {
    console.log("⏳ Waiting 30 seconds for Etherscan indexing...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️  Verification failed (might already be verified):", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
