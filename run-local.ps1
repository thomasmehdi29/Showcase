$ErrorActionPreference = "Stop"

$root = "c:\Users\thoma\Documents\OneDrive\Local App Code"
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$toolsRoot = Join-Path $root ".tools"
$portableRoot = Join-Path $toolsRoot "portable"
$portableVersion = "v24.13.1"
$portableDir = Join-Path $portableRoot "node-$portableVersion-win-x64"
$portableZip = Join-Path $toolsRoot "node-$portableVersion-win-x64.zip"

function Ensure-PortableNode {
  New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
  New-Item -ItemType Directory -Force -Path $portableRoot | Out-Null

  if (-not (Test-Path $portableZip)) {
    $url = "https://nodejs.org/dist/$portableVersion/node-$portableVersion-win-x64.zip"
    Write-Host "Downloading portable Node.js from $url ..."
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $portableZip
  }

  if (-not (Test-Path (Join-Path $portableDir "node.exe"))) {
    Write-Host "Extracting portable Node.js..."
    tar -xf $portableZip -C $portableRoot
  }

  return (Join-Path $portableDir "node.exe")
}

function Invoke-NpmInstall {
  param (
    [string]$WorkingDirectory,
    [string]$NodeExe,
    [string]$NpmCli
  )

  Push-Location $WorkingDirectory
  try {
    & $NodeExe $NpmCli install
  }
  finally {
    Pop-Location
  }
}

function Wait-ForUrl {
  param (
    [string]$Url,
    [int]$Attempts = 30
  )

  for ($i = 0; $i -lt $Attempts; $i++) {
    try {
      Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3 | Out-Null
      return $true
    }
    catch {
      Start-Sleep -Milliseconds 500
    }
  }

  return $false
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCommand) {
  $nodeExe = $nodeCommand.Source
  Write-Host "Using system Node.js: $nodeExe"
}
else {
  Write-Host "System Node.js not found on PATH. Using portable runtime in workspace."
  $nodeExe = Ensure-PortableNode
}

$nodeHome = Split-Path $nodeExe -Parent
$npmCli = Join-Path $nodeHome "node_modules\npm\bin\npm-cli.js"
$viteCli = "node_modules/vite/bin/vite.js"
$backendEntry = "src/server.js"
$pidFile = Join-Path $root ".showcase-pids.json"
$backendOut = Join-Path $root "backend-dev.out.log"
$backendErr = Join-Path $root "backend-dev.err.log"
$frontendOut = Join-Path $root "frontend-dev.out.log"
$frontendErr = Join-Path $root "frontend-dev.err.log"

if (-not (Test-Path $npmCli)) {
  Write-Host "npm CLI not found near node binary. Re-downloading portable runtime."
  $nodeExe = Ensure-PortableNode
  $nodeHome = Split-Path $nodeExe -Parent
  $npmCli = Join-Path $nodeHome "node_modules\npm\bin\npm-cli.js"
}

Write-Host "Installing backend dependencies..."
Invoke-NpmInstall -WorkingDirectory $backend -NodeExe $nodeExe -NpmCli $npmCli

Write-Host "Installing frontend dependencies..."
Invoke-NpmInstall -WorkingDirectory $frontend -NodeExe $nodeExe -NpmCli $npmCli

Write-Host "Starting backend..."
$backendProcess = Start-Process -FilePath $nodeExe -ArgumentList @($backendEntry) -WorkingDirectory $backend -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr -PassThru

Write-Host "Starting frontend..."
$frontendProcess = Start-Process -FilePath $nodeExe -ArgumentList @($viteCli, "--host", "127.0.0.1", "--port", "5173") -WorkingDirectory $frontend -RedirectStandardOutput $frontendOut -RedirectStandardError $frontendErr -PassThru

$pidData = @{
  backendPid = $backendProcess.Id
  frontendPid = $frontendProcess.Id
} | ConvertTo-Json
Set-Content -Path $pidFile -Value $pidData

$backendUp = Wait-ForUrl -Url "http://127.0.0.1:4000/api/health"
$frontendUp = Wait-ForUrl -Url "http://127.0.0.1:5173"

Write-Host ""
Write-Host "Showcase startup complete."
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "PIDs saved to: $pidFile"
Write-Host ""
Write-Host "Open these URLs:"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend Health: http://localhost:4000/api/health"
Write-Host "Vendors API: http://localhost:4000/api/vendors"
Write-Host "Events API: http://localhost:4000/api/events"
Write-Host "Locations API: http://localhost:4000/api/locations"
Write-Host ""
Write-Host "Backend reachable: $backendUp"
Write-Host "Frontend reachable: $frontendUp"
