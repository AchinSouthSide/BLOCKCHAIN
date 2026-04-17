require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local Hardhat Network (Recommended)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: "remote", // Will be provided by hardhat node
    },
    
    // Hardhat In-Process Network (Testing)
    hardhat: {
      chainId: 31337,
      gasPrice: 875000000,
      initialBaseFeePerGas: 0,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20, // Create 20 test accounts
      },
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
      loggingEnabled: false,
    },

    // Sepolia Testnet (Optional - requires testnet ETH)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
