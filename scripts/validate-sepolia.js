#!/usr/bin/env node

/**
 * Validate Environment Setup for Sepolia Deployment
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validating Sepolia Environment Setup...\n");

const envPath = path.join(__dirname, "../.env");
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.error("❌ .env file not found!");
  console.log("\nCreate .env with:");
  console.log('  SEPOLIA_RPC_URL=https://rpc.sepolia.org');
  console.log("  PRIVATE_KEY=your_private_key_here");
  process.exit(1);
}

// Read .env
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};

envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

console.log("✅ Checks:");

// Check RPC URL
const rpcUrl = env.SEPOLIA_RPC_URL;
if (!rpcUrl) {
  console.log(
    "❌ SEPOLIA_RPC_URL not set. Add to .env:\n   SEPOLIA_RPC_URL=https://rpc.sepolia.org"
  );
  process.exit(1);
}
console.log(`✔  SEPOLIA_RPC_URL: ${rpcUrl}`);

// Check Private Key
const privateKey = env.PRIVATE_KEY;
if (!privateKey || privateKey.length < 60) {
  console.log(
    "❌ PRIVATE_KEY not set or invalid. Get from MetaMask Settings > Privacy"
  );
  process.exit(1);
}
console.log(`✔  PRIVATE_KEY: ${privateKey.substring(0, 10)}...`);

// Check ethers
try {
  require("ethers");
  console.log("✔  ethers.js: installed");
} catch {
  console.log("❌ ethers.js not installed");
  process.exit(1);
}

// Check hardhat
try {
  require("hardhat");
  console.log("✔  hardhat: installed");
} catch {
  console.log("❌ hardhat not installed");
  process.exit(1);
}

console.log("\n✅ All checks passed! Ready to deploy.\n");
console.log("Run: npm run deploy:sepolia");
