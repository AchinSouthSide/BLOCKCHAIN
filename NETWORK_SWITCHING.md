# Network Switching Guide

The FieldBooking dApp now supports dynamic network switching between Hardhat Local, Sepolia Testnet, and Ethereum Mainnet.

## Architecture

### 1. **NetworkConfig.js** - Network Configuration Module
Located in `frontend/src/services/NetworkConfig.js`

**Supported Networks:**
```
┌─────────────────────────────────────────────────────────────┐
│ Chain ID │ Network Name        │ RPC Endpoint              │
├─────────────────────────────────────────────────────────────┤
│ 31337    │ Hardhat Local       │ http://127.0.0.1:8545     │
│ 11155111 │ Sepolia Testnet     │ https://rpc.sepolia.org   │
│ 1        │ Ethereum Mainnet    │ https://eth.public...     │
└─────────────────────────────────────────────────────────────┘
```

**Key Methods:**
- `getCurrent()` - Get current network config
- `getByName(networkName)` - Find network by name
- `getNetwork(chainId)` - Get network by chain ID
- `setNetwork(chainId)` - Switch active network
- `getRpcUrl()` - Get current RPC URL
- `getExplorerUrl()` - Get block explorer URL
- `isTestnet()` - Check if current network is testnet

### 2. **Enhanced ContractService.js**
Located in `frontend/src/services/ContractService.js`

**New Method: `switchNetwork(networkName)`**
```javascript
// Switch to Sepolia Testnet
await ContractService.switchNetwork('Sepolia Testnet');

// Switch to Hardhat Local
await ContractService.switchNetwork('Hardhat Local');

// Switch to Mainnet
await ContractService.switchNetwork('Ethereum Mainnet');
```

**How It Works:**
1. Validates network name against NetworkConfig
2. Attempts wallet_switchEthereumChain (if network already added in MetaMask)
3. If network not found, automatically adds it via wallet_addEthereumChain
4. Updates NetworkConfig state to track current network
5. Returns boolean indicating success

**Error Handling:**
- Validates MetaMask is installed
- Catches and handles "chain not added" error (code 4902)
- Provides detailed console logging with [ContractService] prefix

## Usage Examples

### Example 1: Switching Networks in a Component
```javascript
import ContractService from '../services/ContractService.js';

function NetworkSwitcher() {
  const handleSwitchToSepolia = async () => {
    try {
      await ContractService.switchNetwork('Sepolia Testnet');
      console.log('✅ Successfully switched to Sepolia');
      // Optionally refresh contract data
      window.location.reload();
    } catch (error) {
      console.error('❌ Network switch failed:', error);
      alert('Failed to switch network: ' + error.message);
    }
  };

  return (
    <button onClick={handleSwitchToSepolia}>
      Switch to Sepolia Testnet
    </button>
  );
}
```

### Example 2: Checking Current Network
```javascript
import NetworkConfig from '../services/NetworkConfig.js';

function NetworkDisplay() {
  const current = NetworkConfig.getCurrent();
  return (
    <div>
      <p>Current Network: {current.name}</p>
      <p>Chain ID: {current.chainId}</p>
      <p>Type: {current.type}</p>
    </div>
  );
}
```

### Example 3: Conditional Logic Based on Network
```javascript
import NetworkConfig from '../services/NetworkConfig.js';

async function createFieldWithNetworkCheck() {
  const current = NetworkConfig.getCurrent();
  
  // Warn if using mainnet
  if (current.type === 'mainnet') {
    const confirm = window.confirm(
      '⚠️ You are on Ethereum Mainnet. Real ETH will be used. Continue?'
    );
    if (!confirm) return;
  }
  
  // Allow any testnet/local
  if (current.type === 'testnet' || current.type === 'local') {
    // Proceed with flow
  }
}
```

## Step-by-Step: Switching to Sepolia

### 1. Ensure MetaMask is Connected
- MetaMask extension installed and unlocked
- At least one account created

### 2. Request Network Switch
```javascript
// In any component or service
await ContractService.switchNetwork('Sepolia Testnet');
```

### 3. MetaMask Prompts
**First Time:**
- MetaMask shows "Add Sepolia" prompt
- Shows network details (RPC, Chain ID, Block Explorer)
- User clicks "Approve"

**Subsequent Times:**
- MetaMask shows "Switch to Sepolia" prompt
- User clicks "Switch Account"

### 4. Get Test ETH
Once on Sepolia, get free test ETH from:
- [Infura Faucet](https://www.infura.io/faucet/sepolia)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

### 5. Deploy Contract to Sepolia
```bash
# Create .env with:
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=0x...

# Deploy
npm run deploy:sepolia
```

### 6. Update Frontend Configuration
```env
REACT_APP_CONTRACT_ADDRESS=0x...new_sepolia_address...
REACT_APP_NETWORK_ID=11155111
REACT_APP_SEPOLIA_RPC=https://rpc.sepolia.org
```

### 7. Restart Frontend
```bash
npm run frontend
```

### 8. Switch Network in App
```javascript
await ContractService.switchNetwork('Sepolia Testnet');
```

### 9. Verify Connection
- Check MetaMask shows Sepolia
- Verify contract balance in app
- Create test field to verify functionality

## Full Network Switching Flow

```
User Action
    ↓
Click "Switch to Sepolia" Button
    ↓
ContractService.switchNetwork('Sepolia Testnet')
    ↓
NetworkConfig.getByName() - Lookup network config
    ↓
window.ethereum.request(wallet_switchEthereumChain)
    ↓
    ├─ Success? → Network switched! ✅
    │
    └─ Error 4902? (Chain not in MetaMask)
        ↓
        wallet_addEthereumChain
        ↓
        MetaMask shows "Add Sepolia" prompt
        ↓
        User approves
        ↓
        Network added & switched ✅

NetworkConfig.setNetwork(chainId)
    ↓
Update internal state
    ↓
Return success
    ↓
Component updates, frontend can now interact with new network ✅
```

## Configuration Files

### NetworkConfig.js Structure
```javascript
{
  chainId: 11155111,
  name: 'Sepolia Testnet',
  rpc: 'https://rpc.sepolia.org',
  explorer: 'https://sepolia.etherscan.io',
  type: 'testnet',
}
```

### Environment Variables
```env
# .env file in project root
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=11155111
REACT_APP_SEPOLIA_RPC=https://rpc.sepolia.org
```

## Troubleshooting

### Problem: "MetaMask not found"
**Solution:** Ensure MetaMask extension is installed and accessible

### Problem: Network not switching
**Solution:** Check console logs for detailed error message

### Problem: "Chain not in MetaMask"
**Solution:** This is normal on first switch. MetaMask will automatically add the network via wallet_addEthereumChain

### Problem: RPC endpoint not responding
**Solution:** Try different RPC provider:
- Sepolia: https://rpc.sepolia.org, https://sepolia-rpc.com
- Mainnet: Check ethers.js recommended providers

### Problem: Contract address not found on new network
**Solution:** Need to deploy contract to new network first. Use:
```bash
npm run deploy:sepolia
```

## Security Notes

⚠️ **CRITICAL SECURITY WARNING:**
- Never expose PRIVATE_KEY in frontend code
- Private keys should only be in backend .env files
- Network switching in frontend only requests MetaMask to switch, doesn't send keys
- User must manually add account in MetaMask before switching

## Advanced: Adding Custom Networks

To add support for additional networks, edit `NetworkConfig.js`:

```javascript
const NETWORKS = {
  // ... existing networks ...
  
  // Example: Add Polygon Mainnet
  137: {
    name: 'Polygon Mainnet',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    type: 'mainnet',
    chainId: 137,
  },
};
```

Then use:
```javascript
await ContractService.switchNetwork('Polygon Mainnet');
```

## Testing Network Switching

### Test Case 1: Switch from Hardhat to Sepolia
```
1. Start Hardhat: npx hardhat node
2. Run frontend: npm run frontend
3. Connect with MetaMask (should be on Hardhat)
4. Click "Switch to Sepolia"
5. MetaMask prompts "Switch to Sepolia"
6. User approves
7. Frontend contract calls should now target Sepolia
```

### Test Case 2: Switch to Network Not in MetaMask
```
1. Ensure Sepolia is not in MetaMask
2. Run: await ContractService.switchNetwork('Sepolia Testnet')
3. MetaMask shows "Add Sepolia" prompt
4. Check network details are correct
5. User clicks "Approve"
6. Network added and switched
```

### Test Case 3: Error Handling
```
1. Disconnect MetaMask
2. Try to switch network
3. Should show error: "MetaMask not found"
4. Console should show detailed error
```

## Summary

✅ **What's Supported:**
- Automatic network detection in MetaMask
- Automatic network addition if not present
- Easy one-function switching: `ContractService.switchNetwork(name)`
- Centralized network configuration
- Clear error messages and logging

✅ **Best Practices:**
- Always show user what network they're switching to
- Warn before switching to mainnet (real ETH)
- Refresh contract data after switch
- Save network preference to localStorage if needed

✅ **Next Steps:**
1. Add UI component for network switching
2. Show current network in header
3. Warn on mainnet transactions
4. Save user's preferred network
5. Add network indicator with color coding
