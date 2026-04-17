/**
 * Deploy Script for Sepolia Testnet
 */

const { ethers } = require("ethers");

async function main() {
  console.log("🚀 Deploying FieldBooking to Sepolia Testnet...\n");

  const deploymentData = require("../deployment.json");

  // Get signer
  const signer = await ethers.provider.getSigner();
  const deployerAddress = await signer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("📝 Deployment Info:");
  console.log(`   Deployer: ${deployerAddress}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

  if (parseFloat(ethers.formatEther(balance)) < 0.01) {
    console.error("❌ Insufficient ETH for deployment (need ~0.01 ETH)");
    process.exit(1);
  }

  // Deploy contract
  const FieldBooking = await ethers.getContractFactory("FieldBooking");
  console.log("\n⏳ Deploying contract...");

  const contract = await FieldBooking.deploy();
  await contract.deploymentTransaction().wait(1);

  const deployedAddress = await contract.getAddress();

  console.log("✅ FieldBooking deployed successfully!");
  console.log(`   Contract Address: ${deployedAddress}`);
  console.log(`   Transaction: https://sepolia.etherscan.io/address/${deployedAddress}`);

  // Save deployment info
  const sepolia_data = {
    /...deploymentData,
    sepolia: {
      address: deployedAddress,
      deploymentTx: contract.deploymentTransaction()?.hash,
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    __dirname + "/../deployment-sepolia.json",
    JSON.stringify(sepolia_data, null, 2)
  );

  console.log("\n📄 Deployment data saved to deployment-sepolia.json");
  console.log("\n✨ Ready to use! Update frontend with this address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  });
