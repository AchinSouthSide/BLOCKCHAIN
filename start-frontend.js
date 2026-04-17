#!/usr/bin/env node
// Frontend startup wrapper to bypass PowerShell execution policy

const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const reactScriptsPath = path.join(frontendDir, 'node_modules', '.bin', 'react-scripts');

console.log('🚀 Starting React Frontend Development Server...');
console.log('📍 Opening http://localhost:3000 in a moment...\n');

const child = spawn('node', [reactScriptsPath, 'start'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '3000'
  }
});

child.on('error', (error) => {
  console.error('❌ Error starting frontend:', error);
  process.exit(1);
});
