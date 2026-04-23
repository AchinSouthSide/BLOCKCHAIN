<#
FieldBooking - demo runner (Hardhat local + Cloudflare tunnel + Azure SWA rebuild)

Default behavior (recommended for demo persistence):
- If Hardhat RPC is already running AND deployment.json exists, reuse the existing contract
  to preserve on-chain demo data.
- Use -Redeploy to deploy a fresh contract (will reset demo data).

Usage (from FieldBooking/):
  powershell -ExecutionPolicy Bypass -File .\RUN_DEMO.ps1
  powershell -ExecutionPolicy Bypass -File .\RUN_DEMO.ps1 -Redeploy
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

Write-Host "\n=== FieldBooking Demo Runner ===\n" -ForegroundColor Cyan

# --- Requirements ---
Require-Command -name 'node' -installHint 'Install Node.js 18+.'
Require-Command -name 'npm.cmd' -installHint 'Node.js install should include npm.'
Require-Command -name 'gh' -installHint 'Install GitHub CLI (gh) and login (gh auth login).'

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
} else {
  Write-Host "Hardhat RPC already listening on http://${rpcHost}:$rpcPort" -ForegroundColor Green
}

# --- Deploy contract to localhost (fresh chain after reboot) ---
# Default first Hardhat account (deterministic) — OK for demo.
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

if (-not (Test-Path $deploymentPath)) { throw "deployment.json not found." }

$deployment = Get-Content $deploymentPath -Raw | ConvertFrom-Json
$contractAddress = [string]$deployment.contractAddress
$chainId = [string]$deployment.chainId

if (-not $contractAddress) { throw 'Missing contractAddress in deployment.json' }
if (-not $chainId) { throw 'Missing chainId in deployment.json' }

Write-Host "Deployed contract: $contractAddress (chainId=$chainId)" -ForegroundColor Green

# --- Start Cloudflare quick tunnel and capture HTTPS URL ---
$cloudflared = $null
$cloudflaredCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflaredCmd) {
  $cloudflared = $cloudflaredCmd.Source
} else {
  $candidatePaths = @(
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe'
  )
  foreach ($p in $candidatePaths) {
    if (Test-Path $p) { $cloudflared = $p; break }
  }
}

if (-not $cloudflared) {
  throw "cloudflared not found. Install Cloudflare Tunnel (cloudflared) and ensure it's in PATH."
}

$runId = [Guid]::NewGuid().ToString('N')
$logPath = Join-Path $env:TEMP ("fieldbooking_cloudflared_$runId.log")
$errPath = Join-Path $env:TEMP ("fieldbooking_cloudflared_$runId.err.log")
New-Item -Path $logPath -ItemType File -Force | Out-Null
New-Item -Path $errPath -ItemType File -Force | Out-Null

function Find-TunnelUrl([string]$text) {
  if (-not $text) { return $null }
  # cloudflared output can be wrapped with newlines/spaces in the middle of the URL.
  $flat = ($text -replace '\s', '')
  if ($flat -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
    return $matches[0]
  }
  return $null
}

Write-Host "Starting Cloudflare quick tunnel for http://${rpcHost}:$rpcPort ..." -ForegroundColor Yellow
$cfProc = Start-Process -FilePath $cloudflared -ArgumentList @('tunnel','--url',"http://${rpcHost}:$rpcPort",'--no-autoupdate') -RedirectStandardOutput $logPath -RedirectStandardError $errPath -PassThru

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow
$tunnelUrl = $null

# First scan existing content (cloudflared may print the URL immediately).
try {
  $initialText = (Get-Content -Path $logPath -Raw -ErrorAction SilentlyContinue) + "\n" + (Get-Content -Path $errPath -Raw -ErrorAction SilentlyContinue)
  $tunnelUrl = Find-TunnelUrl $initialText
} catch {
  $tunnelUrl = $null
}

# If not found yet, poll the log for a short time (avoid missing early output).
if (-not $tunnelUrl) {
  $deadline = (Get-Date).AddSeconds(30)
  while ((-not $tunnelUrl) -and ((Get-Date) -lt $deadline)) {
    try {
      $text = (Get-Content -Path $errPath -Raw -ErrorAction SilentlyContinue) + "\n" + (Get-Content -Path $logPath -Raw -ErrorAction SilentlyContinue)
      $tunnelUrl = Find-TunnelUrl $text
    } catch {
      $tunnelUrl = $null
    }
    if (-not $tunnelUrl) { Start-Sleep -Milliseconds 250 }
  }
}

if (-not $tunnelUrl) {
  throw 'Could not detect trycloudflare tunnel URL. Check log: ' + $logPath
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
gh workflow run $workflowName -r main -f deployment_environment=production | Out-Null

Write-Host "\nDone. Keep these running during demo:" -ForegroundColor Cyan
Write-Host "  - Hardhat node window"
Write-Host "  - cloudflared process (PID=$($cfProc.Id))"
Write-Host "\nIf attendees already opened the Azure link, ask them to hard refresh (Ctrl+F5)." -ForegroundColor Cyan
