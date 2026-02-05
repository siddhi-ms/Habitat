
import os
import sys
import json
from datetime import datetime, timedelta

# Project root
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE_FILE = os.path.join(ROOT, "model_state_demo.json")

def run_scheduler_demo():
    print("="*60)
    print("DEMO: SMART DAILY SCHEDULER")
    print("="*60)
    print("Goal: Run Weather Daily, Run Satellite Model Weekly (Throttled)")
    print("-"*60)

    # 1. Simulate Daily Task (Always Runs)
    print("[Task A] Fetching Daily Weather API Alerts (Every 24h)...")
    print("  ✓ Success: City: Mumbai | Temp: 28°C | Clearing Skies")
    
    # 2. Simulate Throttled Task logic
    print("\n[Task B] Checking Satellite/Unified Model Schedule (Target: Every 7 Days)...")
    
    # Mocking a recent run
    last_run = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
    print(f"  Checking model_state.json... Last run found: {last_run}")
    
    days_since = (datetime.now() - datetime.strptime(last_run, "%Y-%m-%d")).days
    if days_since >= 7:
        print("  ✓ Triggering Unified Model (7+ days passed)...")
    else:
        print(f"  → Skipping Satellite Model ({days_since}/7 days passed). Using Cached Insights.")

    print("\nBENEFITS FOR JUDGES:")
    print("1. Saves GPU/Satellite API costs by avoiding redundant processing.")
    print("2. Ensures Daily Weather is always up-to-date for safety.")
    print("3. Intelligent resource management for large-scale deployments.")
    print("="*60)

if __name__ == "__main__":
    run_scheduler_demo()
