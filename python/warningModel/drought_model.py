
import numpy as np
import os
import joblib
from datetime import datetime, timedelta

class DroughtWarningModel:
    """
    Separate model specifically for drought warnings and 3-week predictions.
    Uses current environmental data and historical trends to estimate future risk.
    """
    
    def __init__(self, model_path=None):
        self.model = None
        # In a real scenario, this would load a specialized classifier/regressor
        # For now, we use a logic-based risk aggregator or a simple RF model
        if model_path and os.path.exists(model_path):
            self.model = joblib.load(model_path)
            
    def predict_drought_risk(self, predictions_norm, tree_species_data):
        """
        Calculate drought risk looking 3 weeks ahead.
        Args:
            predictions_norm: The normalized output from the Unified Model (current/predicted weather)
            tree_species_data: Data about the specific tree species sensitivity
        """
        # Logic: Drought is high if (Low Rainfall + High Temp + Low Soil Depth + High ET0)
        # We use the normalized values from the Unified Model as sensors
        
        rain_score = predictions_norm.get('rainfall_30d', 0)
        temp_score = predictions_norm.get('temp_max', 0)
        et0_score = predictions_norm.get('et0', 0)
        moisture_tol = tree_species_data.get('drought_tol_norm', 0.5)
        
        # Drought index calculation (weighted sum of stressors)
        # Higher index = more likely drought
        drought_index = (temp_score * 0.4) + (et0_score * 0.3) - (rain_score * 0.3)
        
        # Adjust by tree sensitivity
        adjusted_score = drought_index * (1.0 - moisture_tol)
        
        # Categorize
        if adjusted_score < -0.2:
            level = "Low"
            probability = np.clip(10 + adjusted_score * 10, 0, 30)
        elif adjusted_score < 0.5:
            level = "Moderate"
            probability = 30 + (adjusted_score + 0.2) * 40
        else:
            level = "High"
            probability = np.clip(70 + adjusted_score * 20, 70, 99)
            
        return {
            "drought_risk_level": level,
            "drought_probability_pct": round(float(probability), 2),
            "lead_time_weeks": 3,
            "warning_message": self._get_message(level),
            "critical_factors": self._get_factors(rain_score, temp_score, et0_score)
        }
        
    def _get_message(self, level):
        messages = {
            "Low": "Conditions are stable. No immediate drought risk expected in the next 3 weeks.",
            "Moderate": "Warming trends detected. Maintain regular irrigation and monitor soil moisture.",
            "High": "CRITICAL: High drought probability detected for the 3-week window. Implement water saving measures immediately."
        }
        return messages.get(level, "Monitoring conditions...")
        
    def _get_factors(self, rain, temp, et0):
        factors = []
        if rain < -0.5: factors.append("Low cumulative rainfall")
        if temp > 0.5: factors.append("High surface temperature")
        if et0 > 0.5: factors.append("High evapotranspiration rate")
        return factors if factors else ["Stable trends"]
