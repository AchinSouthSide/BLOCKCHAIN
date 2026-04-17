/**
 * EnsureHardhatNetwork.js
 * Comprehensive network setup with multiple attempts and fallback instructions
 */

const HARDHAT_CONFIG = {
  chainId: '0x7a69',
  chainIdNum: 31337,
  chainName: 'Hardhat Local',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorerUrls: [],
};

/**
 * ENSURE Hardhat network is in MetaMask (retry multiple times)
 * Returns: { success, message, steps?: [] }
 */
export async function ensureHardhatNetwork() {
  console.log('[EnsureHardhat] 🚀 Starting network setup...');

  if (!window.ethereum) {
    return {
      success: false,
      message: 'MetaMask not found. Please install MetaMask extension.',
      steps: [
        'Install MetaMask from chrome.google.com/webstore',
        'Refresh this page',
        'Click Login again'
      ]
    };
  }

  // **ATTEMPT 1: Direct Add**
  console.log('[EnsureHardhat] Attempt 1: Adding network directly...');
  let addResult = await attemptAddNetwork();
  if (addResult.success) {
    return {
      success: true,
      message: 'Network added to MetaMask successfully'
    };
  }

  // **ATTEMPT 2: If network already exists (4902), try switching**
  if (addResult.code === 4902 || addResult.code === -32602) {
    console.log('[EnsureHardhat] Attempt 2: Network may exist, trying to switch...');
    let switchResult = await attemptSwitch();
    if (switchResult.success) {
      return {
        success: true,
        message: 'Switched to existing Hardhat network'
      };
    }
    
    // If switch failed with 4902, user needs to add manually
    if (switchResult.code === 4902) {
      return {
        success: false,
        message: 'Network not in MetaMask. Please add it manually.',
        steps: getManualAddSteps()
      };
    }
  }

  // **ATTEMPT 3: If user rejected (4001), give clear message**
  if (addResult.code === 4001) {
    return {
      success: false,
      message: 'You rejected adding the network. Please approve to continue.',
      steps: [
        'Click Login again',
        'Click Approve when MetaMask asks "Add Hardhat Local?"',
        'Continue'
      ]
    };
  }

  // **ATTEMPT 4: Unknown error with fallback**
  return {
    success: false,
    message: `Network setup failed. Error: ${addResult.message || 'Unknown'}`,
    steps: getManualAddSteps()
  };
}

/**
 * Try to add Hardhat network
 */
async function attemptAddNetwork() {
  try {
    console.log('[EnsureHardhat] Calling wallet_addEthereumChain...');
    const result = await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [HARDHAT_CONFIG],
    });

    console.log('[EnsureHardhat] ✅ Add successful:', result);
    return { success: true, result };
  } catch (error) {
    console.error('[EnsureHardhat] Add failed. Error code:', error.code, error.message);
    return {
      success: false,
      code: error.code,
      message: error.message
    };
  }
}

/**
 * Try to switch to Hardhat network
 */
async function attemptSwitch() {
  try {
    console.log('[EnsureHardhat] Calling wallet_switchEthereumChain...');
    const result = await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_CONFIG.chainId }],
    });

    console.log('[EnsureHardhat] ✅ Switch successful:', result);
    return { success: true, result };
  } catch (error) {
    console.error('[EnsureHardhat] Switch failed. Error code:', error.code, error.message);
    return {
      success: false,
      code: error.code,
      message: error.message
    };
  }
}

/**
 * Get manual steps for user to add Hardhat network
 */
function getManualAddSteps() {
  return [
    '1. Open MetaMask extension',
    '2. Click Settings (gear icon)',
    '3. Select "Networks" → "Add a network" → "Add a network manually"',
    '4. Fill in:',
    '   • Network name: Hardhat Local',
    '   • RPC URL: http://127.0.0.1:8545',
    '   • Chain ID: 31337',
    '   • Currency: ETH',
    '5. Click Save',
    '6. Go back and refresh this page',
    '7. Try Login again'
  ];
}

/**
 * Verify current network is Hardhat
 */
export async function verifyHardhatNetwork() {
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    console.log('[EnsureHardhat] Current ChainID:', chainId);
    return chainId === HARDHAT_CONFIG.chainIdNum;
  } catch (error) {
    console.error('[EnsureHardhat] Error verifying network:', error);
    return false;
  }
}

export default ensureHardhatNetwork;
