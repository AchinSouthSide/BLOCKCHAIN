<#
FieldBooking - One-machine local DEV runner (Hardhat + Deploy + Frontend dev server)

Goal:
- Full functionality on ONE machine.
- No Azure, no tunnel, no other device needed.
- Fast iteration (react-scripts start) while still using on-chain Hardhat data.

Usage (from FieldBooking/):
  powershell -ExecutionPolicy Bypass -File .\RUN_LOCAL_DEV.ps1
  powershell -ExecutionPolicy Bypass -File .\RUN_LOCAL_DEV.ps1 -Redeploy

Notes:
- Keeps demo data as long as the Hardhat node stays running.
- If Hardhat restarts (chain reset), you MUST redeploy.
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

function Wait-ForPort([string]$host, [int]$port, [int]$timeoutSeconds = 20) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      if (Test-NetConnection -ComputerName $host -Port $port -InformationLevel Quiet) {
        return $true
      }
    } catch {}
    Start-Sleep -Seconds 1
  }
  return $false
}

function Get-EthGetCode([string]$rpcUrl, [string]$address) {
  if (-not $address) { return $null }
  $payload = @{ jsonrpc = '2.0'; id = 1; method = 'eth_getCode'; params = @($address, 'latest') } | ConvertTo-Json -Compress
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $rpcUrl -ContentType 'application/json' -Body $payload -TimeoutSec 10
    return [string]$resp.result
  } catch {
    return $null
  }
}

Write-Host "\n=== FieldBooking Local DEV Runner (1 machine) ===\n" -ForegroundColor Cyan

Require-Command -name 'node' -installHint 'Install Node.js 18+.'
Require-Command -name 'npm.cmd' -installHint 'Node.js install should include npm.'

# --- Ensure deps for Hardhat exist ---
$hardhatCmd = Join-Path $repoRoot 'node_modules\.bin\hardhat.cmd'
if (-not (Test-Path $hardhatCmd)) {
  Write-Host "Installing root dependencies (npm ci)..." -ForegroundColor Yellow
  npm.cmd ci
}

if (-not (Test-Path (Join-Path $repoRoot 'frontend\node_modules'))) {
  Write-Host "Installing frontend dependencies (npm ci)..." -ForegroundColor Yellow
  npm.cmd --prefix frontend ci
}

# --- Start Hardhat node if needed ---
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

  Write-Host "Waiting for Hardhat RPC to become ready..." -ForegroundColor Yellow
  if (-not (Wait-ForPort -host $rpcHost -port $rpcPort -timeoutSeconds 20)) {
    throw "Hardhat RPC did not start in time on http://${rpcHost}:$rpcPort. Keep the Hardhat window open and check for errors."
  }
} else {
  Write-Host "Hardhat RPC already listening on http://${rpcHost}:$rpcPort" -ForegroundColor Green
}

# --- Deploy (or reuse) ---
$adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
$env:ADMIN_ADDRESS = $adminAddress

$deploymentPath = Join-Path $repoRoot 'deployment.json'

$shouldDeploy = $Redeploy -or (-not (Test-Path $deploymentPath))

if (-not $shouldDeploy) {
  try {
    $deployment = Get-Content $deploymentPath -Raw | ConvertFrom-Json
    $contractAddress = [string]$deployment.contractAddress
    $rpcUrl = "http://${rpcHost}:$rpcPort"
    $code = Get-EthGetCode -rpcUrl $rpcUrl -address $contractAddress
    if (-not $code -or $code.ToLowerInvariant() -eq '0x') {
      Write-Host "Detected missing contract code at $contractAddress (chain was likely reset). Will redeploy..." -ForegroundColor Yellow
      $shouldDeploy = $true
    }
  } catch {
    Write-Host "Could not verify existing deployment; will redeploy for safety." -ForegroundColor Yellow
    $shouldDeploy = $true
  }
}

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

$deployment = Get-Content $deploymentPath -Raw | ConvertFrom-Json
$contractAddress = [string]$deployment.contractAddress
$chainId = [string]$deployment.chainId

Write-Host "\nContract: $contractAddress (chainId=$chainId)" -ForegroundColor Green
Write-Host "Frontend env: frontend/.env.local is auto-generated by deploy.js" -ForegroundColor Green

# --- Start CRA dev server ---
$frontendPort = 3000
$frontendListening = $false
try {
  $frontendListening = Test-NetConnection -ComputerName '127.0.0.1' -Port $frontendPort -InformationLevel Quiet
} catch {
  $frontendListening = $false
}

if (-not $frontendListening) {
  Write-Host "Starting frontend dev server on http://localhost:$frontendPort ..." -ForegroundColor Yellow
  $frontendCmd = "cd '$repoRoot'; npm.cmd --prefix frontend start"
  Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command', $frontendCmd) | Out-Null
} else {
  Write-Host "Frontend dev server already listening on http://localhost:$frontendPort" -ForegroundColor Green
}

Write-Host "\n✅ ONE-MACHINE DEMO READY" -ForegroundColor Cyan
Write-Host "Open: http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host "\nMetaMask setup (1 machine):" -ForegroundColor Cyan
Write-Host "  - Add network: RPC http://127.0.0.1:8545 ; ChainId 31337" -ForegroundColor Cyan
Write-Host "  - Import 2 Hardhat accounts (private keys shown in Hardhat node window)" -ForegroundColor Cyan
Write-Host "\nHow to simulate multi-user trade/booking on ONE machine:" -ForegroundColor Cyan
Write-Host "  Option A: Use 2 MetaMask accounts and switch account in the extension" -ForegroundColor Cyan
Write-Host "  Option B: Open a second Chrome/Edge profile (separate MetaMask)" -ForegroundColor Cyan
Write-Host "\nIf you see '0x / could not decode' errors:" -ForegroundColor Yellow
Write-Host "  - Hardhat probably restarted (chain reset) => rerun with -Redeploy" -ForegroundColor Yellow
