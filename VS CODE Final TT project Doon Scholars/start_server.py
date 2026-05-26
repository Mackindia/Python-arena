import subprocess
import time
import webbrowser
import os
import sys

# Step 1: Kill any process listening on port 5173
print("Step 1: Checking for processes on port 5173...")
try:
    result = subprocess.run(
        "netstat -ano | findstr :5173",
        shell=True,
        capture_output=True,
        text=True
    )
    if result.stdout.strip():
        print(f"Found process(es) on port 5173:")
        print(result.stdout)
        # Extract PID from netstat output (last column)
        lines = result.stdout.strip().split('\n')
        for line in lines:
            parts = line.split()
            if parts:
                pid = parts[-1]
                print(f"Killing PID {pid}...")
                subprocess.run(f"taskkill /PID {pid} /F", shell=True, capture_output=True)
                time.sleep(0.5)
    else:
        print("No process found on port 5173")
except Exception as e:
    print(f"Error checking port: {e}")

# Wait a moment for port to be released
time.sleep(1)

# Step 2: Start Python HTTP server in background
print("\nStep 2: Starting Python HTTP server...")
# Dynamically find the path relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
dist_path = os.path.join(script_dir, "timetable-web-app", "dist")

if not os.path.exists(dist_path):
    print(f"Error: Directory does not exist: {dist_path}")
    sys.exit(1)

# Start the server as a detached process
CREATE_NEW_PROCESS_GROUP = 0x00000200
CREATE_NO_WINDOW = 0x08000000

# Use Python's http.server module
cmd = [
    sys.executable,
    "-m",
    "http.server",
    "5173",
    "--bind",
    "127.0.0.1",
    "--directory",
    dist_path
]

process = subprocess.Popen(
    cmd,
    creationflags=CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
    cwd=dist_path,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

pid = process.pid
print(f"Server started with PID: {pid}")

# Wait for server to start
time.sleep(2)

# Step 3: Open browser
print("\nStep 3: Opening browser...")
url = "http://127.0.0.1:5173"
try:
    webbrowser.open(url)
    print(f"Browser opened to {url}")
except Exception as e:
    print(f"Error opening browser: {e}")

# Step 4: Report PID
print(f"\n=== SERVER DETAILS ===")
print(f"PID: {pid}")
print(f"URL: {url}")
print(f"Directory: {dist_path}")
print(f"Status: Running")
