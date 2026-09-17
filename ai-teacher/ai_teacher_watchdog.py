"""
AI Teacher Watchdog - Auto-restarts FastAPI server on crash
Usage: python ai_teacher_watchdog.py [--port 8000] [--max-restarts 10] [--no-open]
"""
import subprocess
import sys
import os
import time
import signal
import argparse
import urllib.request
import urllib.error
from datetime import datetime

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    colors = {"INFO": "\033[36m", "OK": "\033[32m", "WARN": "\033[33m", "ERR": "\033[31m"}
    reset = "\033[0m"
    color = colors.get(level, "\033[0m")
    print(f"  {color}[{ts}] [{level}]{reset} {msg}")

def check_health(port, timeout=5):
    try:
        url = f"http://localhost:{port}/docs"
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status == 200
    except Exception:
        return False

def start_server(port, script_dir):
    cmd = [sys.executable, "-m", "uvicorn", "main:app",
           "--host", "0.0.0.0", "--port", str(port), "--reload"]
    return subprocess.Popen(cmd, cwd=script_dir)

def open_browser(port):
    import webbrowser
    url = f"http://localhost:{port}/docs"
    log(f"Opening {url}", "INFO")
    webbrowser.open(url)

def main():
    parser = argparse.ArgumentParser(description="AI Teacher Watchdog")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--max-restarts", type=int, default=10)
    parser.add_argument("--no-open", action="store_true")
    parser.add_argument("--health-interval", type=int, default=30)
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print()
    print("  \033[36m╔══════════════════════════════════════════════════╗\033[0m")
    print("  \033[36m║     AI Teacher Watchdog - Auto-Restart          ║\033[0m")
    print("  \033[36m╠══════════════════════════════════════════════════╣\033[0m")
    print(f"  \033[36m║  Server  : http://localhost:{args.port}                 ║\033[0m")
    print(f"  \033[36m║  Docs    : http://localhost:{args.port}/docs            ║\033[0m")
    print(f"  \033[36m║  Max     : {args.max_restarts} restarts                      ║\033[0m")
    print("  \033[36m╚══════════════════════════════════════════════════╝\033[0m")
    print()

    # Check Python deps
    log("Checking dependencies...")
    try:
        import uvicorn, fastapi, dotenv
        log("Dependencies OK", "OK")
    except ImportError as e:
        log(f"Missing package: {e}. Installing...", "WARN")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", 
                       os.path.join(script_dir, "requirements.txt")])

    restart_count = 0
    process = None
    browser_opened = False

    def cleanup(signum=None, frame=None):
        log("Shutting down watchdog...", "WARN")
        if process and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    while restart_count < args.max_restarts:
        restart_count += 1
        log(f"Starting server (attempt {restart_count}/{args.max_restarts})...")
        
        process = start_server(args.port, script_dir)
        
        # Wait for server to be healthy
        log("Waiting for server to be healthy...")
        healthy = False
        for i in range(20):
            time.sleep(2)
            if check_health(args.port):
                healthy = True
                break
        
        if healthy:
            log(f"Server is HEALTHY on port {args.port}!", "OK")
            
            if not browser_opened and not args.no_open:
                open_browser(args.port)
                browser_opened = True
            
            # Monitor loop
            while True:
                time.sleep(args.health_interval)
                if process.poll() is not None:
                    log(f"Server process exited (code: {process.returncode})", "ERR")
                    break
                if not check_health(args.port):
                    log("Health check failed!", "ERR")
                    break
        else:
            log("Server failed to start within timeout", "ERR")
            if process.poll() is None:
                process.terminate()
        
        if restart_count < args.max_restarts:
            log(f"Restarting in 5 seconds...", "WARN")
            time.sleep(5)
    
    log(f"Max restarts ({args.max_restarts}) reached. Exiting.", "ERR")
    cleanup()

if __name__ == "__main__":
    main()
