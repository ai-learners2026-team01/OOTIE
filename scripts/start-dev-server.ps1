$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$stateDirectory = Join-Path $env:LOCALAPPDATA 'OOTie\dev-server'
$statePath = Join-Path $stateDirectory 'server.json'
$stdoutPath = Join-Path $stateDirectory 'stdout.log'
$stderrPath = Join-Path $stateDirectory 'stderr.log'
$port = 5173
$hostAddress = '127.0.0.1'
$viteCli = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'

if (-not (Test-Path $viteCli)) {
  throw "Vite is not installed at $viteCli. Run npm install first."
}

New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null

$listeners = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
if ($listeners.Count -gt 0) {
  if (Test-Path $statePath) {
    $state = Get-Content $statePath -Raw | ConvertFrom-Json
    if ($listeners.OwningProcess -contains [int]$state.processId) {
      Write-Output "OOTie preview is already running at http://${hostAddress}:$port/ (PID $($state.processId))."
      exit 0
    }
  }

  $ownerPid = $listeners[0].OwningProcess
  throw "Port $port is already in use by PID $ownerPid. Stop that process or choose another port."
}

$nodePath = (Get-Command node -ErrorAction Stop).Source
$serverProcess = Start-Process `
  -FilePath $nodePath `
  -ArgumentList @($viteCli, '--host', $hostAddress, '--strictPort') `
  -WorkingDirectory $projectRoot `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -WindowStyle Hidden `
  -PassThru

$state = [pscustomobject]@{
  processId = $serverProcess.Id
  nodePath = $nodePath
  startedAtTicks = $serverProcess.StartTime.ToUniversalTime().Ticks
  port = $port
}
$state | ConvertTo-Json | Set-Content -Path $statePath -Encoding ASCII

Write-Output "Started OOTie preview in the background: http://${hostAddress}:$port/ (PID $($serverProcess.Id))."
Write-Output "Logs: $stdoutPath"
Write-Output 'This server remains available after this terminal closes. Run npm run dev:stop to stop it.'