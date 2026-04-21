<#
FieldBooking - One-command local runner (Hardhat + Deploy + Build + Server)

Goal:
- After reboot, run everything with ONE command.
- Keeps demo data as long as the Hardhat node stays running.

Usage (from FieldBooking/):
  powershell -ExecutionPolicy Bypass -File .\RUN_LOCAL.ps1
  powershell -ExecutionPolicy Bypass -File .\RUN_LOCAL.ps1 -Redeploy

Notes:
- Azure does NOT store on-chain data. This script is for LOCAL running.
- If you want Azure demo, use RUN_DEMO.ps1 (tunnel + GH variables).
#>

param(
  [switch]$Redeploy
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

function Require-Command([string]$name, [string]$installHint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: '$name'. $installHint"
  }
}

Write-Host "\n=== FieldBooking Local Runner ===\n" -ForegroundColor Cyan

Require-Command -name 'node' -installHint 'Install Node.js 18+.'
Require-Command -name 'npm.cmd' -installHint 'Node.js install should include npm.'

$hardhatCmd = Join-Path $repoRoot 'node_modules\.bin\hardhat.cmd'
if (-not (Test-Path $hardhatCmd)) {
  Write-Host "Installing root dependencies (npm ci)..." -ForegroundColor Yellow
  npm.cmd ci
}

if (-not (Test-Path (Join-Path $repoRoot 'frontend\node_modules'))) {
  Write-Host "Installing frontend dependencies (npm ci)..." -ForegroundColor Yellow
  npm.cmd --prefix frontend ci
}

$rpcHost = '127.0.0.1'
$rpcPort = 8545
$rpcListening = $false
try {
  $rpcListening = Test-NetConnection -ComputerName $rpcHost -Port $rpcPort -InformationLevel Quiet
} catch {
  $rpcListening = $false
}

if (-not $rpcListening) {
  Write-Host "Starting Hardhat node on http://${rpcHost}:$rpcPort ..." -ForegroundColor Yellow
  $hardhatNodeCmd = "cd '$repoRoot'; .\\node_modules\\.bin\\hardhat.cmd node --hostname $rpcHost --port $rpcPort"
  Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command', $hardhatNodeCmd) | Out-Null
} else {
  Write-Host "Hardhat RPC already listening on http://${rpcHost}:$rpcPort" -ForegroundColor Green
}

# Default first Hardhat account (deterministic)
$adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
$env:ADMIN_ADDRESS = $adminAddress

$deploymentPath = Join-Path $repoRoot 'deployment.json'
$shouldDeploy = $Redeploy -or (-not (Test-Path $deploymentPath)) -or (-not $rpcListening)

if ($shouldDeploy) {
  Write-Host "Deploying contract to localhost (ADMIN_ADDRESS=$adminAddress)..." -ForegroundColor Yellow
  & $hardhatCmd run .\scripts\deploy.js --network localhost
} else {
  Write-Host "Reusing existing deployment.json (no redeploy) to preserve demo data." -ForegroundColor Green
  Write-Host "Tip: run with -Redeploy to deploy a fresh contract (resets demo data)." -ForegroundColor Cyan
}

if (-not (Test-Path $deploymentPath)) {
  throw "deployment.json not found. Deploy may have failed."
}

Write-Host "Building frontend (production bundle)..." -ForegroundColor Yellow
npm.cmd --prefix frontend run build

# Start server.js (serves frontend/build on :3001)
$port = 3001
$serverListening = $false
try {
  $serverListening = Test-NetConnection -ComputerName '127.0.0.1' -Port $port -InformationLevel Quiet
} catch {
  $serverListening = $false
}

if (-not $serverListening) {
  Write-Host "Starting local server on http://localhost:$port ..." -ForegroundColor Yellow
  $serverCmd = "cd '$repoRoot'; node .\\server.js"
  Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command', $serverCmd) | Out-Null
} else {
  Write-Host "Server already listening on http://localhost:$port" -ForegroundColor Green
}

Write-Host "\nDone." -ForegroundColor Green
Write-Host "- Frontend: http://localhost:$port" -ForegroundColor Cyan
Write-Host "- RPC:      http://${rpcHost}:$rpcPort" -ForegroundColor Cyan
Write-Host "\nKeep the Hardhat node window open to keep on-chain data." -ForegroundColor Yellow

# Open browser
try {
  Start-Process "http://localhost:$port" | Out-Null
} catch {
  # ignore
}
