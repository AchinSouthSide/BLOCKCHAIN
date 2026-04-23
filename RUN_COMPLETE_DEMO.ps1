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

# Public Azure URL (stable)
$azureUrl = "https://brave-plant-0fe513f00.7.azurestaticapps.net"

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

function Get-ContractCode([string]$rpcUrl, [string]$address) {
  try {
    return [string](Invoke-JsonRpc -rpcUrl $rpcUrl -method 'eth_getCode' -params @($address, 'latest'))
  } catch {
    return $null
  }
}

function Get-HttpClient([int]$timeoutSeconds = 8) {
  if (-not $script:__fieldbookingHttpClient) {
    $handler = [System.Net.Http.HttpClientHandler]::new()
    $script:__fieldbookingHttpClient = [System.Net.Http.HttpClient]::new($handler)
  }
  $script:__fieldbookingHttpClient.Timeout = [TimeSpan]::FromSeconds($timeoutSeconds)
  return $script:__fieldbookingHttpClient
}

function Invoke-JsonRpc([string]$rpcUrl, [string]$method, [object[]]$params = @()) {
  $client = Get-HttpClient -timeoutSeconds 8
  $payload = @{ jsonrpc = '2.0'; id = 1; method = $method; params = $params } | ConvertTo-Json -Compress
  $content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')

  try {
    $respMsg = $client.PostAsync($rpcUrl, $content).GetAwaiter().GetResult()
    $text = $respMsg.Content.ReadAsStringAsync().GetAwaiter().GetResult()

    if (-not $respMsg.IsSuccessStatusCode) {
      throw "HTTP $([int]$respMsg.StatusCode) calling ${method}: $text"
    }

    $resp = $text | ConvertFrom-Json
    if ($null -ne $resp.error) {
      $msg = [string]($resp.error.message)
      throw "RPC error calling ${method}: $msg"
    }

    return $resp.result
  } catch {
    # Normalize common network errors for clearer output
    $msg = $_.Exception.Message
    throw "RPC request failed calling ${method}: $msg"
  }
}

function Parse-ChainId([string]$chainIdValue) {
  if (-not $chainIdValue) { return $null }
  $s = [string]$chainIdValue
  if ($s -match '^0x[0-9a-fA-F]+$') {
    return [Convert]::ToInt32($s.Substring(2), 16)
  }
  $n = 0
  if ([int]::TryParse($s, [ref]$n)) { return $n }
  return $null
}

function Get-RepoNameWithOwner() {
  try {
    # Example output: AchinSouthSide/BLOCKCHAIN
    $nwo = (gh repo view --json nameWithOwner -q .nameWithOwner) 2>$null
    if ($nwo) { return [string]$nwo }
  } catch {}
  return $null
}

function Wait-ForTunnelRpc([string]$rpcUrl, [int]$timeoutSeconds = 30) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  $lastError = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $null = Invoke-JsonRpc -rpcUrl $rpcUrl -method 'eth_chainId'
      return $true
    } catch {
      $lastError = $_.Exception.Message
    }
    Start-Sleep -Seconds 2
  }
  if ($lastError) {
    throw "Tunnel RPC not reachable within ${timeoutSeconds}s. Last error: $lastError"
  }
  throw "Tunnel RPC not reachable within ${timeoutSeconds}s."
}

# If Hardhat node was restarted, deployment.json may point to an address with no code on the new chain.
if (-not $shouldDeploy) {
  $rpcUrl = "http://${rpcHost}:$rpcPort"
  $code = Get-ContractCode -rpcUrl $rpcUrl -address $contractAddress
  if ($code -eq '0x') {
    Write-Host "deployment.json contract not found on current chain. Redeploying..." -ForegroundColor Yellow
    & $hardhatCmd run .\scripts\deploy.js --network localhost
    $deployment = Get-Content $deploymentPath -Raw | ConvertFrom-Json
    $contractAddress = [string]$deployment.contractAddress
    $chainId = [string]$deployment.chainId
    if (-not $contractAddress) { throw 'Missing contractAddress in deployment.json after redeploy' }
    if (-not $chainId) { throw 'Missing chainId in deployment.json after redeploy' }
  }
}

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

$runId = [Guid]::NewGuid().ToString('N')
$logPath = Join-Path $env:TEMP ("fieldbooking_cloudflared_$runId.log")
$errPath = Join-Path $env:TEMP ("fieldbooking_cloudflared_$runId.err.log")
New-Item -Path $logPath -ItemType File -Force | Out-Null
New-Item -Path $errPath -ItemType File -Force | Out-Null

function Find-TunnelUrl([string]$text) {
  if (-not $text) { return $null }
  # cloudflared output can be wrapped with newlines/spaces in the middle of the URL.
  $flat = ($text -replace '\s', '')
  $regex = [regex]'https://[a-zA-Z0-9-]+\.trycloudflare\.com'
  $all = $regex.Matches($flat)
  if ($all.Count -gt 0) {
    # cloudflared can print multiple URLs if it reconnects/rotates; use the newest.
    return $all[$all.Count - 1].Value
  }
  return $null
}

$cfProc = Start-Process -FilePath $cloudflared -ArgumentList @('tunnel','--url',"http://${rpcHost}:$rpcPort",'--no-autoupdate') -RedirectStandardOutput $logPath -RedirectStandardError $errPath -PassThru

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow
$tunnelUrl = $null

# First scan existing content (cloudflared may print the URL immediately).
try {
  $initialText = (Get-Content -Path $logPath -Raw -ErrorAction SilentlyContinue) + "`n" + (Get-Content -Path $errPath -Raw -ErrorAction SilentlyContinue)
  $tunnelUrl = Find-TunnelUrl $initialText
} catch {
  $tunnelUrl = $null
}

# If not found yet, poll the log for a short time (avoid missing early output).
if (-not $tunnelUrl) {
  $deadline = (Get-Date).AddSeconds(30)
  while ((-not $tunnelUrl) -and ((Get-Date) -lt $deadline)) {
    try {
      $text = (Get-Content -Path $errPath -Raw -ErrorAction SilentlyContinue) + "`n" + (Get-Content -Path $logPath -Raw -ErrorAction SilentlyContinue)
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

# --- Preflight: ensure tunnel works for remote users ---
Write-Host "Running preflight checks (RPC + contract via tunnel)..." -ForegroundColor Yellow
$localRpcUrl = "http://${rpcHost}:$rpcPort"

try {
  Wait-ForTunnelRpc -rpcUrl $tunnelUrl -timeoutSeconds 30

  $localChainHex = Invoke-JsonRpc -rpcUrl $localRpcUrl -method 'eth_chainId'
  $tunnelChainHex = Invoke-JsonRpc -rpcUrl $tunnelUrl -method 'eth_chainId'

  $localChain = Parse-ChainId $localChainHex
  $tunnelChain = Parse-ChainId $tunnelChainHex
  $expectedChain = Parse-ChainId $chainId

  if ($null -eq $expectedChain) { throw "Invalid chainId in deployment.json: $chainId" }
  if ($localChain -ne $expectedChain) {
    throw "Local RPC chainId mismatch. Expected=$expectedChain, Actual=$localChain"
  }
  if ($tunnelChain -ne $expectedChain) {
    throw "Tunnel RPC chainId mismatch. Expected=$expectedChain, Actual=$tunnelChain"
  }

  $codeLocal = Get-ContractCode -rpcUrl $localRpcUrl -address $contractAddress
  if (-not $codeLocal -or $codeLocal -eq '0x') {
    throw "Contract not found on local RPC at $contractAddress. Try rerun with -Redeploy."
  }

  $codeTunnel = Get-ContractCode -rpcUrl $tunnelUrl -address $contractAddress
  if (-not $codeTunnel -or $codeTunnel -eq '0x') {
    throw "Contract not reachable via tunnel at $contractAddress. Remote users will FAIL."
  }

  Write-Host "[OK] Preflight passed: chainId + contract code verified via tunnel." -ForegroundColor Green
} catch {
  Write-Host "[ERROR] Preflight failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Fix hints:" -ForegroundColor Yellow
  Write-Host "  - Keep Hardhat node running on http://${rpcHost}:$rpcPort" -ForegroundColor Yellow
  Write-Host "  - Keep cloudflared tunnel running" -ForegroundColor Yellow
  Write-Host "  - If needed, run again with: .\RUN_COMPLETE_DEMO.ps1 -Redeploy" -ForegroundColor Yellow
  throw
}

# --- Update GitHub repo Variables (build-time env for Azure SWA) ---
Write-Host "Updating GitHub Variables for Azure build..." -ForegroundColor Yellow

gh variable set REACT_APP_NETWORK_ID -b $chainId | Out-Null
gh variable set REACT_APP_CONTRACT_ADDRESS -b $contractAddress | Out-Null
gh variable set REACT_APP_HARDHAT_RPC -b $tunnelUrl | Out-Null

Write-Host "Variables updated:" -ForegroundColor Green
Write-Host "  REACT_APP_NETWORK_ID=$chainId"
Write-Host "  REACT_APP_CONTRACT_ADDRESS=$contractAddress"
Write-Host "  REACT_APP_HARDHAT_RPC=$tunnelUrl"

# --- Write a persistent demo info file to Desktop (so reboot/open later is easy) ---
try {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $infoPath = Join-Path $desktop 'BLOCKCHAIN_DEMO_INFO.txt'
  $info = @"
FieldBooking Demo Info (Hardhat)
===============================
Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Azure URL:
$azureUrl

Hardhat RPC Tunnel (use this in MetaMask RPC URL):
$tunnelUrl

ChainId:
$chainId

Contract Address:
$contractAddress

MetaMask setup (for attendees on other Wi-Fi):
1) Add network manually:
   - Network name: Hardhat Local
   - RPC URL: $tunnelUrl
   - Chain ID: 31337
   - Currency: ETH
2) Import a Hardhat prefunded private key (10,000 ETH) from demo-wallets.json or DEMO_HARDHAT_ACCOUNTS.md
3) Open Azure URL and hard refresh if needed (Ctrl+F5)

Important:
- Host MUST keep Hardhat node + cloudflared tunnel windows running.
"@
  Set-Content -Path $infoPath -Value $info -Encoding UTF8
  Write-Host "Saved demo info: $infoPath" -ForegroundColor Green
} catch {
  Write-Host "[WARNING] Could not write demo info file to Desktop." -ForegroundColor Yellow
}

# --- Trigger Azure Static Web Apps workflow ---
Write-Host "Triggering Azure redeploy (GitHub Actions)..." -ForegroundColor Yellow
$workflowName = 'Azure Static Web Apps CI/CD'
$repoNwo = Get-RepoNameWithOwner
$triggeredRunId = $null
try {
  gh workflow run $workflowName -r main | Out-Null
  Write-Host "[OK] Workflow triggered: $workflowName" -ForegroundColor Green

  # Try to capture the newest run id for polling
  $runs = gh run list --workflow $workflowName --limit 1 --json databaseId,createdAt,status,conclusion,url | ConvertFrom-Json
  if ($runs -and $runs.Count -gt 0) {
    $triggeredRunId = [string]$runs[0].databaseId
    Write-Host "Azure Run: $($runs[0].url)" -ForegroundColor Cyan
  }
} catch {
  Write-Host "[WARNING] Could not trigger workflow. You can trigger manually in GitHub Actions." -ForegroundColor Yellow
}

# --- Wait for Azure workflow result (best-effort) ---
if ($triggeredRunId -and $repoNwo) {
  Write-Host "`nWaiting for Azure workflow to deploy (up to 5 minutes)..." -ForegroundColor Cyan
  $deadline = (Get-Date).AddMinutes(5)
  $final = $null
  while ((Get-Date) -lt $deadline) {
    try {
      $final = gh api "repos/$repoNwo/actions/runs/$triggeredRunId" --jq '{status:.status, conclusion:.conclusion, html_url:.html_url}' | ConvertFrom-Json
      if ($final.status -eq 'completed') { break }
    } catch {
      # ignore transient GH/api errors
    }
    Start-Sleep -Seconds 5
  }

  if ($final -and $final.status -eq 'completed') {
    if ($final.conclusion -eq 'success') {
      Write-Host "[OK] Azure deploy success." -ForegroundColor Green
    } else {
      Write-Host "[WARNING] Azure deploy not successful yet: $($final.conclusion)" -ForegroundColor Yellow
      if ($final.html_url) { Write-Host "Run details: $($final.html_url)" -ForegroundColor Yellow }
    }
  } else {
    Write-Host "[WARNING] Azure deploy status unknown (timeout)." -ForegroundColor Yellow
  }
} else {
  Write-Host "`nWaiting for Azure workflow to start (30 seconds)..." -ForegroundColor Cyan
  Start-Sleep -Seconds 30
}

Write-Host "Opening Azure demo in browser: $azureUrl" -ForegroundColor Green
Start-Process $azureUrl

Write-Host "`n[OK] Demo is ready!" -ForegroundColor Cyan
Write-Host "Important: Keep these windows open during the demo:" -ForegroundColor Green
Write-Host "  - Hardhat node window"
Write-Host "  - Cloudflared process (tunnel) (PID=$($cfProc.Id))"
Write-Host "`nTip: If the page loads blank, do Hard Refresh (Ctrl+F5)." -ForegroundColor Yellow
