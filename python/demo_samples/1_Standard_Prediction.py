
import os
import sys
import json
from datetime import datetime

# Setup paths to import from Root and Unified_Model
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT)
sys.path.append(os.path.join(ROOT, 'Unified_Model'))

from api import PredictionRequest, predict, startup_event

async def run_demo():
    print("="*60)
    print("DEMO: STANDARD GEO-AI PREDICTION")
    print("="*60)
    print("Target: Mango Plantation @ Maharashtra")
    print("-"*60)

    # Simulated Request
    req = PredictionRequest(
        latitude=16.118,
        longitude=73.6597,
        sapling_type="Mango",
        date=datetime.now().strftime("%Y-%m-%d")
    )

    print("[1/3] Initializing Unified & Warning Models...")
    await startup_event()

    print("[2/3] Fetching Satellite Data & Running Inference...")
    response = await predict(req)

    print("[3/3] Analysis Complete. Results:")
    print("-"*60)
    print(f"Location:  {response.latitude}, {response.longitude}")
    print(f"Crop:      {response.sapling_type}")
    print(f"Risk:      {response.risk_rating}")
    print(f"Soil pH:   {response.pH}")
    print(f"Texture:   {response.Texture_Code}")
    
    print("\nWARNING ANALYTICS:")
    if response.warning_analytics:
        wa = response.warning_analytics
        print(f"  Drought Risk: {wa.get('drought_risk_level')} ({wa.get('drought_probability_pct')}%)")
        print(f"  Health Alert: {wa.get('health_risk', {}).get('health_risk_level')}")
        print(f"  Advice:       {wa.get('health_risk', {}).get('health_advice')}")
    
    print("="*60)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_demo())
