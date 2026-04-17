#!/usr/bin/env node
// Launch script to start Hardhat node without PowerShell execution policy issues

const { exec } = require('child_process');
const path = require('path');

const hardhatPath = path.join(__dirname, 'node_modules', '.bin', 'hardhat');

console.log('🚀 Starting Hardhat Local Node...');
console.log('📍 Node will be available at: http://127.0.0.1:8545');
console.log('⏳ Waiting for connections...\n');

const child = exec(`"${hardhatPath}" node`, {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

child.stdout?.on('data', (data) => {
  console.log(data);
});

child.stderr?.on('data', (data) => {
  console.error(data);
});

child.on('error', (error) => {
  console.error('❌ Error starting Hardhat:', error);
  process.exit(1);
});
