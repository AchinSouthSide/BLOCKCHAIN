#!/usr/bin/env node
// Deploy script wrapper to bypass PowerShell execution policy

const { spawn } = require('child_process');
const path = require('path');

const hardhatPath = path.join(__dirname, 'node_modules', '.bin', 'hardhat.cmd');

console.log('🚀 Deploying FieldBooking Smart Contract...\n');

const child = spawn('node', [hardhatPath, 'run', 'scripts/deploy.js', '--network', 'localhost'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  windowsHide: false
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Deployment completed successfully!');
  } else {
    console.error('\n❌ Deployment failed with code:', code);
    process.exit(code);
  }
});

child.on('error', (error) => {
  console.error('❌ Error during deployment:', error);
  process.exit(1);
});
