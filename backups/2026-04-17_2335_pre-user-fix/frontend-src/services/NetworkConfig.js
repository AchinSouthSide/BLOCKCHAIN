/**
 * Network Configuration for Frontend
 * Default: Hardhat Local (ChainID: 31337)
 * No fees, instant transactions, perfect for development
 */

const NETWORKS = {
  // ========== HARDHAT LOCAL NETWORK (RECOMMENDED) ==========
  31337: {
    name: 'Hardhat Local',
    rpc: 'http://127.0.0.1:8545',
    explorer: 'http://localhost',
    type: 'local',
    chainId: 31337,
    symbol: 'ETH',
    decimals: 18,
  },

  // ========== SEPOLIA TESTNET (OPTIONAL - requires test ETH) ==========
  11155111: {
    name: 'Sepolia Testnet',
    rpc: process.env.REACT_APP_SEPOLIA_RPC || 'https://rpc.sepolia.org',
    explorer: 'https://sepolia.etherscan.io',
    type: 'testnet',
    chainId: 11155111,
    symbol: 'ETH',
    decimals: 18,
  },

  // ========== ETHEREUM MAINNET (NOT RECOMMENDED) ==========
  1: {
    name: 'Ethereum Mainnet',
    rpc: 'https://eth.public.blastapi.io',
    explorer: 'https://etherscan.io',
    type: 'mainnet',
    chainId: 1,
    symbol: 'ETH',
    decimals: 18,
  },
};

// ⚠️ DEFAULT: Always Hardhat Local (ChainID 31337)
// Never use testnet/mainnet unless explicitly configured
let CURRENT_NETWORK = 31337;

// Override if explicitly set in environment
if (process.env.REACT_APP_NETWORK_ID) {
  const envNetworkId = parseInt(process.env.REACT_APP_NETWORK_ID);
  if (NETWORKS[envNetworkId]) {
    CURRENT_NETWORK = envNetworkId;
    console.log(`✅ Network set from env: ${NETWORKS[envNetworkId].name}`);
  }
}

const NetworkConfig = {
  NETWORKS,

  /**
   * Get current network config
   * Always defaults to Hardhat Local if not explicitly set
   */
  getCurrent() {
    const network = NETWORKS[CURRENT_NETWORK];
    if (!network) {
      console.warn(`⚠️ Network ${CURRENT_NETWORK} not found, defaulting to Hardhat Local`);
      return NETWORKS[31337];
    }
    return network;
  },

  /**
   * Get network by ID
   * Falls back to Hardhat Local for unknown IDs
   */
  getNetwork(chainId) {
    return NETWORKS[chainId] || NETWORKS[31337];
  },

  /**
   * Switch network
   * Validates that network exists before switching
   */
  setNetwork(chainId) {
    if (NETWORKS[chainId]) {
      CURRENT_NETWORK = chainId;
      const networkName = NETWORKS[chainId].name;
      console.log(`✅ Network switched to: ${networkName}`);
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
   * Get network by name
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
   * Check if current network is local
   */
  isLocal() {
    return this.getCurrent().type === 'local';
  },

  /**
   * Check if current network is testnet
   */
  isTestnet() {
    return this.getCurrent().type === 'testnet';
  },

  /**
   * Check if current network is mainnet
   */
  isMainnet() {
    return this.getCurrent().type === 'mainnet';
  },
};

export default NetworkConfig;
