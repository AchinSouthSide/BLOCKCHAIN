/**
 * Network Setup Helper
 * Force-configure Hardhat network in MetaMask properly
 */

export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_RPC = process.env.REACT_APP_HARDHAT_RPC || 'http://127.0.0.1:8545';
export const HARDHAT_CHAIN_ID_HEX = '0x7a69';

/**
 * Add Hardhat Network to MetaMask (Force)
 */
export async function addHardhatNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask chưa được cài đặt');
  }

  try {
    console.log('[NetworkSetup] 🔧 FORCE adding Hardhat network to MetaMask...');

    const result = await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: HARDHAT_CHAIN_ID_HEX,
          chainName: 'Hardhat Local',
          rpcUrls: [HARDHAT_RPC],
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          blockExplorerUrls: [],
        },
      ],
    });

    console.log('[NetworkSetup] ✅ Hardhat network force-added successfully:', result);
    return true;
  } catch (error) {
    console.error('[NetworkSetup] addHardhatNetwork error code:', error.code);
    console.error('[NetworkSetup] addHardhatNetwork error:', error.message);
    
    // Code 4902 = network not added (need to add)
    // Code 4001 = user rejected
    // Code -32602 = invalid params
    
    if (error.code === 4902) {
      console.warn('[NetworkSetup] Network not found, will add in switchToHardhat()');
      return false;
    } else if (error.code === 4001) {
      console.warn('[NetworkSetup] User rejected adding network');
      throw error;
    } else if (error.code === -32602) {
      console.warn('[NetworkSetup] Invalid params, network may already exist');
      return true; // Assume already exists
    }
    
    throw error;
  }
}

/**
 * Switch to Hardhat Network
 */
export async function switchToHardhat() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    console.log('[NetworkSetup] 🔧 Switching to Hardhat network (ChainID: 31337)...');

    const result = await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
    });

    console.log('[NetworkSetup] ✅ Switched to Hardhat network:', result);
    return true;
  } catch (error) {
    console.error('[NetworkSetup] Switch error code:', error.code);
    
    // 4902 = chain not added to MetaMask
    if (error.code === 4902) {
      console.log('[NetworkSetup] 🔧 Network not in MetaMask, adding it...');
      try {
        await addHardhatNetwork();
        // Try switching again after adding
        return await switchToHardhat();
      } catch (addError) {
        console.error('[NetworkSetup] Failed to add network:', addError);
        throw addError;
      }
    }
    
    if (error.code === 4001) {
      throw new Error('User rejected switching network');
    }
    
    throw error;
  }
}

/**
 * Check if currently on Hardhat
 */
export async function isHardhatNetwork() {
  if (!window.ethereum) return false;

  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    console.log('[NetworkSetup] Current ChainID:', chainId);
    return chainId === HARDHAT_CHAIN_ID;
  } catch (error) {
    console.error('[NetworkSetup] Error checking network:', error);
    return false;
  }
}
