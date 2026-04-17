const hre = require("hardhat");

function usageAndExit() {
  console.log(
    [
      "\nUsage:",
      "  (Recommended on Windows/Hardhat v2) Set env vars then run:",
      "    $env:ACTION='add'; $env:CONTRACT_ADDRESS='0xContract'; $env:WALLET_ADDRESS='0xAdmin'; npx.cmd hardhat run scripts/admin.js --network localhost",
      "\n  (If your Hardhat supports argv passthrough):",
      "    npx hardhat run scripts/admin.js --network <network> -- <add|remove|check> <contractAddress> <walletAddress>",
      "\nExamples:",
      "  $env:ACTION='add'; $env:CONTRACT_ADDRESS='0xContract'; $env:WALLET_ADDRESS='0xAdmin'; npx.cmd hardhat run scripts/admin.js --network localhost",
      "  $env:ACTION='check'; $env:CONTRACT_ADDRESS='0xContract'; $env:WALLET_ADDRESS='0xAdmin'; npx.cmd hardhat run scripts/admin.js --network localhost",
    ].join("\n")
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const action = (args[0] || process.env.ACTION || "").trim();
  const contractAddress = (args[1] || process.env.CONTRACT_ADDRESS || "").trim();
  const walletAddress = (args[2] || process.env.WALLET_ADDRESS || "").trim();

  if (!action || !contractAddress || !walletAddress) usageAndExit();

  if (!hre.ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }
  if (!hre.ethers.isAddress(walletAddress)) {
    throw new Error(`Invalid wallet address: ${walletAddress}`);
  }

  const [owner] = await hre.ethers.getSigners();
  console.log("[admin.js] Network:", hre.network.name);
  console.log("[admin.js] Caller (platformOwner):", owner.address);
  console.log("[admin.js] Contract:", contractAddress);
  console.log("[admin.js] Target wallet:", walletAddress);

  const FieldBooking = await hre.ethers.getContractFactory("FieldBooking");
  const contract = FieldBooking.attach(contractAddress).connect(owner);

  if (action === "check") {
    const isAdmin = await contract.isAdmin(walletAddress);
    console.log("[admin.js] isAdmin:", isAdmin);
    return;
  }

  let tx;
  if (action === "add") {
    tx = await contract.addAdmin(walletAddress);
    console.log("[admin.js] addAdmin tx:", tx.hash);
  } else if (action === "remove") {
    tx = await contract.removeAdmin(walletAddress);
    console.log("[admin.js] removeAdmin tx:", tx.hash);
  } else {
    usageAndExit();
  }

  await tx.wait();
  const isAdminAfter = await contract.isAdmin(walletAddress);
  console.log("[admin.js] isAdmin after:", isAdminAfter);
}

main().catch((err) => {
  console.error("[admin.js] Error:", err?.message || err);
  process.exitCode = 1;
});
