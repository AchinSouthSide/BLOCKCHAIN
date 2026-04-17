/**
 * Network Configuration for Frontend
 */

const NETWORKS = {
  // Hardhat Local
  31337: {
    name: 'Hardhat Local',
    rpc: 'http://127.0.0.1:8545',
    explorer: 'http://localhost',
    type: 'local',
    chainId: 31337,
  },

  // Sepolia Testnet
  11155111: {
    name: 'Sepolia Testnet',
    rpc: process.env.REACT_APP_SEPOLIA_RPC || 'https://rpc.sepolia.org',
    explorer: 'https://sepolia.etherscan.io',
    type: 'testnet',
    chainId: 11155111,
  },

  // Ethereum Mainnet
  1: {
    name: 'Ethereum Mainnet',
    rpc: 'https://eth.public.blastapi.io',
    explorer: 'https://etherscan.io',
    type: 'mainnet',
    chainId: 1,
  },
};

// Current network (can be changed)
let CURRENT_NETWORK = parseInt(process.env.REACT_APP_NETWORK_ID) || 11155111;

const NetworkConfig = {
  NETWORKS,

  /**
   * Get current network config
   */
  getCurrent() {
    return NETWORKS[CURRENT_NETWORK] || NETWORKS[11155111];
  },

  /**
   * Get network by ID
   */
  getNetwork(chainId) {
    return NETWORKS[chainId] || NETWORKS[11155111];
  },

  /**
   * Switch network
   */
  setNetwork(chainId) {
    if (NETWORKS[chainId]) {
      CURRENT_NETWORK = chainId;
      console.log(`✅ Network switched to: ${NETWORKS[chainId].name}`);
      return true;
    }
    console.error(`❌ Unknown network: ${chainId}`);
    return false;
  },

  /**
   * Get RPC URL for network
   */
  getRpcUrl(chainId = null) {
    const network = chainId ? NETWORKS[chainId] : this.getCurrent();
    return network?.rpc;
  },

  /**
   * Get explorer URL
   */
  getExplorerUrl(txHash = '') {
    const network = this.getCurrent();
    if (txHash) {
      return `${network.explorer}/tx/${txHash}`;
    }
    return network.explorer;
  },

  /**
   * Get network by name (e.g., 'Sepolia Testnet', 'Hardhat Local')
   */
  getByName(networkName) {
    for (const chainId in NETWORKS) {
      if (NETWORKS[chainId].name === networkName) {
        return { ...NETWORKS[chainId], chainId: parseInt(chainId) };
      }
    }
    return null;
  },

  /**
   * Check if local
   */
  isLocal() {
    return this.getCurrent().type === 'local';
  },

  /**
   * Validate network
   */
  validate(chainId) {
    if (!NETWORKS[chainId]) {
      throw new Error(`❌ Network ${chainId} not supported`);
    }
    return true;
  },
};

export default NetworkConfig;
