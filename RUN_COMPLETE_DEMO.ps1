<#
FieldBooking - One-Click Complete Demo (Hardhat + Deploy + Tunnel + Azure + Auto-Open)

What it does:
1) Ensure Hardhat node is running (localhost:8545)
2) Deploy contract if needed (reuse deployment.json by default to preserve demo data)
3) Build local frontend + start local server on :3001 
4) Start Cloudflare quick tunnel for the RPC
5) Update GitHub Variables used by Azure build
6) Trigger Azure Static Web Apps workflow
7) Auto-open Azure SWA URL in browser (with short delay for workflow to start)
8) Keep everything running in background windows

Usage (from FieldBooking/):
  powershell -ExecutionPolicy Bypass -File .\RUN_COMPLETE_DEMO.ps1

After running:
  - Hardhat node window: stays open (don't close!)
  - Cloudflared window: stays open (don't close!)
  - Browser: opens Azure SWA link automatically
  - Demo is ready to use!

Notes:
- Azure will work ONLY while your machine keeps Hardhat + cloudflared running.
- Hard refresh (Ctrl+F5) in browser if needed after workflow finishes deploying (2-3 minutes).
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

Write-Host "`n========== FieldBooking - One-Click Complete Demo ==========" -ForegroundColor Cyan
Write-Host "Starting: Hardhat + Deploy + Tunnel + Azure + Auto-Browser`n" -ForegroundColor Cyan

# --- Requirements ---
Require-Command -name 'node' -installHint 'Install Node.js 18+.'
Require-Command -name 'npm.cmd' -installHint 'Node.js install should include npm.'
Require-Command -name 'gh' -installHint 'Install GitHub CLI (gh) and login (gh auth login).'

# cloudflared: either in PATH or in common install location
$cloudflared = $null
$cloudflaredCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflaredCmd) {
  $cloudflared = $cloudflaredCmd.Source
} else {
  $candidatePaths = @(
    'C:\Program Files\cloudflared\cloudflared.exe',
    'C:\Program Files (x86)\cloudflared\cloudflared.exe'
  )
  foreach ($p in $candidatePaths) {
    if (Test-Path $p) { $cloudflared = $p; break }
  }
}
if (-not $cloudflared) {
  throw "cloudflared not found. Install Cloudflare Tunnel (cloudflared) and ensure it's in PATH."
}

# --- Ensure deps for Hardhat exist ---
$hardhatCmd = Join-Path $repoRoot 'node_modules\.bin\hardhat.cmd'
if (-not (Test-Path $hardhatCmd)) {
  Write-Host "Installing root dependencies (npm ci)..." -ForegroundColor Yellow
  npm.cmd ci
}

# --- Verify gh auth ---
try {
  gh auth status -h github.com | Out-Null
} catch {
  throw "GitHub CLI not authenticated. Run: gh auth login"
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
  Start-Sleep -Seconds 3  # Give Hardhat time to start
} else {
  Write-Host "Hardhat RPC already listening on http://${rpcHost}:$rpcPort" -ForegroundColor Green
}

# --- Deploy contract (reuse by default to preserve demo data) ---
$deploymentPath = Join-Path $repoRoot 'deployment.json'
$shouldDeploy = $Redeploy -or (-not (Test-Path $deploymentPath)) -or (-not $rpcListening)

# Default first Hardhat account (deterministic)
$adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
$env:ADMIN_ADDRESS = $adminAddress

if ($shouldDeploy) {
  Write-Host "Deploying contract to localhost (ADMIN_ADDRESS=$adminAddress)..." -ForegroundColor Yellow
  & $hardhatCmd run .\scripts\deploy.js --network localhost
} else {
  Write-Host "Reusing existing deployment.json (no redeploy) to preserve demo data." -ForegroundColor Green
}

if (-not (Test-Path $deploymentPath)) { throw "deployment.json not found." }

$deployment = Get-Content $deploymentPath -Raw | ConvertFrom-Json
$contractAddress = [string]$deployment.contractAddress
$chainId = [string]$deployment.chainId
if (-not $contractAddress) { throw 'Missing contractAddress in deployment.json' }
if (-not $chainId) { throw 'Missing chainId in deployment.json' }

Write-Host "Contract: $contractAddress (chainId=$chainId)" -ForegroundColor Green

# --- Build frontend + start local server ---
if (-not (Test-Path (Join-Path $repoRoot 'frontend\node_modules'))) {
  Write-Host "Installing frontend dependencies (npm ci)..." -ForegroundColor Yellow
  npm.cmd --prefix frontend ci
}

Write-Host "Building frontend (production bundle)..." -ForegroundColor Yellow
npm.cmd --prefix frontend run build

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

# --- Start Cloudflare quick tunnel for RPC ---
Write-Host "Starting Cloudflare quick tunnel for http://${rpcHost}:$rpcPort ..." -ForegroundColor Yellow
Write-Host ">>> Opening cloudflared in a separate window. Please copy the tunnel URL (https://...--.trycloudflare.com) and paste it below." -ForegroundColor Cyan

$cfCmd = "cd '$repoRoot'; & '$cloudflared' tunnel --url http://${rpcHost}:$rpcPort --no-autoupdate; Read-Host 'Press Enter to close this window'"
Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command', $cfCmd) | Out-Null

Write-Host "`n"
$tunnelUrl = Read-Host "Paste the tunnel URL (https://xxxxx.trycloudflare.com)"
$tunnelUrl = $tunnelUrl.Trim()

if (-not ($tunnelUrl -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')) {
  throw "Invalid tunnel URL format. Expected: https://xxxxx.trycloudflare.com"
}

Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Green

# --- Update GitHub repo Variables (build-time env for Azure SWA) ---
Write-Host "Updating GitHub Variables for Azure build..." -ForegroundColor Yellow

gh variable set REACT_APP_NETWORK_ID -b $chainId | Out-Null
gh variable set REACT_APP_CONTRACT_ADDRESS -b $contractAddress | Out-Null
gh variable set REACT_APP_HARDHAT_RPC -b $tunnelUrl | Out-Null

Write-Host "Variables updated:" -ForegroundColor Green
Write-Host "  REACT_APP_NETWORK_ID=$chainId"
Write-Host "  REACT_APP_CONTRACT_ADDRESS=$contractAddress"
Write-Host "  REACT_APP_HARDHAT_RPC=$tunnelUrl"

# --- Trigger Azure Static Web Apps workflow ---
Write-Host "Triggering Azure redeploy (GitHub Actions)..." -ForegroundColor Yellow
$workflowName = 'Azure Static Web Apps CI/CD'
try {
  gh workflow run $workflowName -r main | Out-Null
  Write-Host "[OK] Workflow triggered: $workflowName" -ForegroundColor Green
} catch {
  Write-Host "[WARNING] Could not trigger workflow. You can trigger manually in GitHub Actions." -ForegroundColor Yellow
}

# --- Open Azure SWA URL in browser (with delay for workflow to start) ---
$azureUrl = "https://brave-plant-0fe513f00.7.azurestaticapps.net"
Write-Host "`nWaiting for Azure workflow to deploy (30 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "Opening Azure demo in browser: $azureUrl" -ForegroundColor Green
Start-Process $azureUrl

Write-Host "`n[OK] Demo is ready!" -ForegroundColor Cyan
Write-Host "Important: Keep these windows open during the demo:" -ForegroundColor Green
Write-Host "  - Hardhat node window"
Write-Host "  - Cloudflared window (tunnel)"
Write-Host "`nTip: If the page loads blank, do Hard Refresh (Ctrl+F5)." -ForegroundColor Yellow
