
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

async def run_hazard_demo():
    print("="*60)
    print("DEMO: HAZARDOUS WEATHER & HEATSTROKE ALERTS")
    print("="*60)
    print("Scenario: Extreme Heatwave & High Humidity")
    print("-"*60)

    await startup_event()

    # Complete feature set to satisfy decoder
    mock_high_hazard = {
        "rainfall_weekly": 0.0,
        "rainfall_30d": 0.0,
        "rainfall_90d": 10.0,
        "temp_mean": 38.0,
        "temp_max": 42.0,       # Dangerous Heat
        "temp_min": 25.0,
        "humidity_mean": 85.0,  # High Humidity
        "wind_speed": 4.5,
        "solar_radiation": 28.0,
        "et0": 7.0,
        "pH": 6.5,
        "Org_Carbon_pct": 1.0,
        "Nitrogen_pct": 0.1,
        "Depth_cm": 10.0,
        "Texture_Code_encoded": 0
    }

    with patch('Unified_Model.rf_model.RandomForestPredictor.predict', return_value=mock_high_hazard):
        req = PredictionRequest(latitude=20.0, longitude=75.0, sapling_type="Neem")
        response = await predict(req)

        print("\n[DETECTED] CRITICAL WEATHER EVENT:")
        wa = response.warning_analytics
        health = wa.get('health_risk', {})
        
        print(f"  Heat Index:    {health.get('heat_index_celsius')}°C")
        print(f"  Health Level:  {health.get('health_risk_level')}")
        print(f"  Health Advice: {health.get('health_advice')}")
        
        print("\n[CROP STRESS ALERTS]:")
        for alert in wa.get('weather_alerts', []):
            print(f"  - {alert}")

    print("="*60)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_hazard_demo())
