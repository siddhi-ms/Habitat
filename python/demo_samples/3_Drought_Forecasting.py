
import os
import sys
import json
from datetime import datetime

# Setup paths
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT)
sys.path.append(os.path.join(ROOT, 'Unified_Model'))

from api import PredictionRequest, predict, startup_event
from unittest.mock import patch

async def run_drought_demo():
    print("="*60)
    print("DEMO: 3-WEEK DROUGHT FORECASTING")
    print("="*60)
    print("Scenario: Significant Rainfall Deficit & High Evaporation")
    print("-"*60)

    await startup_event()

    # Complete feature set to satisfy decoder
    mock_drought_cond = {
        "rainfall_weekly": -1.0,
        "rainfall_30d": -2.0,   # Very low (Normalized)
        "rainfall_90d": -1.5,
        "temp_mean": 2.0,
        "temp_max": 2.5,        # Very high (Normalized)
        "temp_min": 0.5,
        "humidity_mean": -1.5,
        "wind_speed": 1.0,
        "solar_radiation": 2.0,
        "et0": 3.0,             # Very high evaporation (Normalized)
        "pH": 6.0,
        "Org_Carbon_pct": 0.5,
        "Nitrogen_pct": 0.05,
        "Depth_cm": 5.0,
        "Texture_Code_encoded": 0
    }

    with patch('Unified_Model.rf_model.RandomForestPredictor.predict', return_value=mock_drought_cond):
        req = PredictionRequest(latitude=18.0, longitude=74.0, sapling_type="Mango")
        response = await predict(req)

        wa = response.warning_analytics
        print(f"\n3-WEEK FORECAST:")
        print(f"  Risk Level:   {wa.get('drought_risk_level')}")
        print(f"  Probability:  {wa.get('drought_probability_pct')}%")
        print(f"  Lead Time:    {wa.get('lead_time_weeks')} Weeks")
        
        print(f"\nFORECAST MESSAGE:")
        print(f"  \"{wa.get('warning_message')}\"")
        
        print(f"\nCRITICAL FACTORS:")
        for factor in wa.get('critical_factors', []):
            print(f"  - {factor}")

    print("="*60)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_drought_demo())
