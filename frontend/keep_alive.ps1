$ErrorActionPreference = 'Stop'
while ($true) {
    Write-Host "Starting Next.js..."
    node server.js
    Write-Host "Next.js crashed or exited. Restarting in 2 seconds..."
    Start-Sleep -Seconds 2
}
