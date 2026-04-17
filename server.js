#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const BUILD_DIR = path.join(__dirname, 'frontend', 'build');

function getDeployedContractAddress() {
  try {
    const deploymentPath = path.join(__dirname, 'deployment.json');
    const raw = fs.readFileSync(deploymentPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.contractAddress || null;
  } catch (e) {
    return null;
  }
}

const server = http.createServer((req, res) => {
  // Normalize the URL
  let filePath = path.join(BUILD_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Prevent directory traversal
  if (!filePath.startsWith(BUILD_DIR)) {
    filePath = path.join(BUILD_DIR, 'index.html');
  }
  
  // Try to serve the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // If file not found, serve index.html for SPA routing
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(BUILD_DIR, 'index.html'), (err, indexContent) => {
          // Prevent caching of index.html so new builds take effect immediately
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          });
          res.end(indexContent, 'utf8');
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      // Determine content type
      let contentType = 'text/html; charset=utf-8';
      if (filePath.endsWith('.js')) contentType = 'application/javascript';
      else if (filePath.endsWith('.css')) contentType = 'text/css';
      else if (filePath.endsWith('.json')) contentType = 'application/json';
      else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (filePath.endsWith('.png')) contentType = 'image/png';
      else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';

      const isIndexHtml = path.basename(filePath) === 'index.html';
      const headers = { 'Content-Type': contentType };
      if (isIndexHtml) {
        // Ensure the browser does not cache the entry HTML
        headers['Cache-Control'] = 'no-store, max-age=0, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }

      res.writeHead(200, headers);
      res.end(content, 'utf8');
    }
  });
});

server.listen(PORT, () => {
  const deployedAddress = getDeployedContractAddress();
  console.log('\n🎉 FieldBooking DApp is Running!');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log(`║  📍 Frontend:    http://localhost:${String(PORT).padEnd(4, ' ')}                    ║`);
  console.log('║  🔗 Blockchain:  http://127.0.0.1:8545                        ║');
  console.log(`║  💼 Contract:    ${(deployedAddress || 'UNKNOWN').padEnd(42, ' ')}  ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Setup Instructions:');
  console.log(`  1. Open http://localhost:${PORT} in your browser`);
  console.log('  2. Connect MetaMask to Hardhat local network:');
  console.log('     - Network: http://127.0.0.1:8545');
  console.log('     - Chain ID: 31337');
  console.log('  3. Import test account private key (from hardhat node logs)');
  console.log('  4. Start booking sports fields!\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    throw err;
  }
});
