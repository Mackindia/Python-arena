# AI Teacher - PowerShell Launcher with Auto-Restart & Health Check
# Usage: Right-click > "Run with PowerShell" or: .\start_ai_teacher.ps1

param(
    [int]$Port = 8000,
    [int]$MaxRestarts = 10,
    [int]$HealthCheckInterval = 30,
    [switch]$NoReload
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$restartCount = 0

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║        AI Teacher Assistant - FastAPI            ║" -ForegroundColor Cyan
    Write-Host "  ╠══════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "  ║  Server  : http://localhost:$Port                 ║" -ForegroundColor Cyan
    Write-Host "  ║  Docs    : http://localhost:$Port/docs            ║" -ForegroundColor Cyan
    Write-Host "  ║  ReDoc   : http://localhost:$Port/redoc           ║" -ForegroundColor Cyan
    Write-Host "  ║  Mode    : Auto-Restart Watchdog                 ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-ServerHealth {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/docs" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-AITeacherServer {
    $reloadFlag = if ($NoReload) { "" } else { "--reload" }
    $args = @("-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$Port", "--log-level", "info")
    if (-not $NoReload) { $args += "--reload" }
    
    $process = Start-Process -FilePath "python" -ArgumentList $args `
        -WorkingDirectory $scriptDir `
        -PassThru -NoNewWindow `
        -RedirectStandardOutput "$scriptDir\server_stdout.log" `
        -RedirectStandardError "$scriptDir\server_stderr.log"
    
    return $process
}

function Stop-Server {
    param($Process)
    if ($Process -and -not $Process.HasExited) {
        Write-Host "  [STOP] Stopping server (PID: $($Process.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# === MAIN ===
Write-Header

Set-Location $scriptDir

# Check Python
Write-Host "  [1/3] Checking Python..." -ForegroundColor White
try {
    $pyVer = python --version 2>&1
    Write-Host "        $pyVer" -ForegroundColor Green
} catch {
    Write-Host "        [ERROR] Python not found!" -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}

# Check uvicorn
Write-Host "  [2/3] Checking dependencies..." -ForegroundColor White
python -c "import uvicorn, fastapi, dotenv" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "        [WARN] Missing packages. Installing..." -ForegroundColor Yellow
    pip install -r requirements.txt
}
Write-Host "        Dependencies OK" -ForegroundColor Green

Write-Host "  [3/3] Starting server with watchdog..." -ForegroundColor White
Write-Host ""
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "   Server starting... Press Ctrl+C to stop" -ForegroundColor White
Write-Host "   Auto-restart enabled (max $MaxRestarts restarts)" -ForegroundColor DarkGray
Write-Host "  ──────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

$serverProcess = $null
$running = $true

# Handle Ctrl+C
[Console]::TreatControlCAsInput = $false
$handler = {
    $running = $false
    Stop-Server -Process $serverProcess
}
# Register cleanup
Register-EngineEvent PowerShell.Exiting -Action { Stop-Server -Process $serverProcess } | Out-Null

while ($running -and $restartCount -lt $MaxRestarts) {
    $restartCount++
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "  [$timestamp] Starting server (attempt $restartCount/$MaxRestarts)..." -ForegroundColor Cyan
    
    $serverProcess = Start-AITeacherServer
    
    # Wait for server to start
    Start-Sleep -Seconds 3
    
    $healthy = $false
    $checkCount = 0
    $maxChecks = 10
    
    while ($checkCount -lt $maxChecks) {
        $checkCount++
        if (Test-ServerHealth) {
            $healthy = $true
            break
        }
        Start-Sleep -Seconds 2
    }
    
    if ($healthy) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "  [$timestamp] Server is HEALTHY and running!" -ForegroundColor Green
        Write-Host "  [$timestamp] Opening browser..." -ForegroundColor White
        Start-Process "http://localhost:$Port/docs"
        
        # Monitor server
        while (-not $serverProcess.HasExited) {
            Start-Sleep -Seconds $HealthCheckInterval
            if (-not (Test-ServerHealth)) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "  [$timestamp] Server unhealthy! Restarting..." -ForegroundColor Red
                Stop-Server -Process $serverProcess
                break
            }
        }
    } else {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "  [$timestamp] Server failed to start!" -ForegroundColor Red
        Stop-Server -Process $serverProcess
        
        if ($restartCount -lt $MaxRestarts) {
            Write-Host "  [$timestamp] Restarting in 5 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

# Cleanup
Stop-Server -Process $serverProcess
Write-Host ""
Write-Host "  Server stopped. Total restarts: $restartCount" -ForegroundColor Yellow
Read-Host "  Press Enter to exit"
