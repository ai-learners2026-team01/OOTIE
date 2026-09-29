$ErrorActionPreference = 'Stop'

$statePath = Join-Path $env:LOCALAPPDATA 'OOTie\dev-server\server.json'
if (-not (Test-Path $statePath)) {
  Write-Output 'No OOTie background preview is registered.'
  exit 0
}

$state = Get-Content $statePath -Raw | ConvertFrom-Json
$serverProcess = Get-Process -Id ([int]$state.processId) -ErrorAction SilentlyContinue
if (-not $serverProcess) {
  Remove-Item $statePath -Force
  Write-Output 'The registered preview process has already stopped.'
  exit 0
}

$startedAtTicks = $serverProcess.StartTime.ToUniversalTime().Ticks
if ($serverProcess.Path -ne $state.nodePath -or $startedAtTicks -ne [long]$state.startedAtTicks) {
  throw "PID $($state.processId) no longer matches the registered Vite process; refusing to stop it."
}

Stop-Process -Id $serverProcess.Id
Remove-Item $statePath -Force
Write-Output "Stopped OOTie background preview (PID $($serverProcess.Id))."