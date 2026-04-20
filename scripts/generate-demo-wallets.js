/*
  Generate N fresh wallets and pre-fund them on a local Hardhat node.

  Usage (from FieldBooking/):
    node scripts/generate-demo-wallets.js 5

  Output:
    - demo-wallets.json
    - demo-wallets.md
*/

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const COUNT = Number(process.argv[2] || 5);

function toHexQuantity(value) {
  const hex = BigInt(value).toString(16);
  return '0x' + (hex.length === 0 ? '0' : hex);
}

async function main() {
  if (!Number.isInteger(COUNT) || COUNT <= 0 || COUNT > 50) {
    throw new Error('COUNT must be an integer between 1 and 50');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // quick sanity check
  const chainId = await provider.send('eth_chainId', []);

  const amountWei = ethers.parseEther('10000');
  const balanceHex = toHexQuantity(amountWei);

  const wallets = [];

  for (let i = 0; i < COUNT; i++) {
    const wallet = ethers.Wallet.createRandom();

    // Fund via Hardhat-only RPC method
    await provider.send('hardhat_setBalance', [wallet.address, balanceHex]);

    // Verify
    const bal = await provider.getBalance(wallet.address);
    if (bal !== amountWei) {
      throw new Error(`Balance mismatch for ${wallet.address}: got ${bal.toString()}`);
    }

    wallets.push({
      index: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
      balanceEth: '10000',
    });
  }

  const outJson = {
    generatedAt: new Date().toISOString(),
    rpcUrl: RPC_URL,
    chainId: Number(chainId),
    currency: 'ETH',
    wallets,
  };

  const repoRoot = path.resolve(__dirname, '..');
  const jsonPath = path.join(repoRoot, 'demo-wallets.json');
  const mdPath = path.join(repoRoot, 'demo-wallets.md');

  fs.writeFileSync(jsonPath, JSON.stringify(outJson, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push('# Demo wallets (prefunded)');
  mdLines.push('');
  mdLines.push(`- RPC: ${RPC_URL}`);
  mdLines.push(`- Chain ID: ${Number(chainId)}`);
  mdLines.push('- Balance: 10,000 ETH each');
  mdLines.push('');
  mdLines.push('**Do not use these private keys on real networks.**');
  mdLines.push('');
  wallets.forEach(w => {
    mdLines.push(`${w.index}) Address: ${w.address}`);
    mdLines.push(`   Private Key: ${w.privateKey}`);
    mdLines.push('');
  });

  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log(`Generated ${COUNT} wallets on chainId=${Number(chainId)} and wrote:`);
  console.log(`- ${jsonPath}`);
  console.log(`- ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
