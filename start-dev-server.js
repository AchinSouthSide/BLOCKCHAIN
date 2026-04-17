#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, 'frontend');
process.chdir(frontendDir);

// Set up environment
process.env.PORT = process.env.PORT || '3000';
process.env.SKIP_PREFLIGHT_CHECK = 'true';

console.log('🚀 Starting React Frontend on http://localhost:3000...\n');

// Require react-scripts and start
require('react-scripts/scripts/start.js');
