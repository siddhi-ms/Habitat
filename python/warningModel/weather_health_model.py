
import numpy as np

class WeatherHealthModel:
    """
    Model for predicting health-related weather risks (Heatstroke) 
    and extreme weather stress for crops (Frost, Heatwaves).
    """
    
    def predict_health_risks(self, temp_max, humidity):
        """
        Calculate Heat Index and associated health risks (Heatstroke).
        Formula: Simplified Heat Index / Apparent Temperature.
        """
        # Simplified Heat Index formula (Steadman)
        # Valid for temp > 20C
        if temp_max > 20:
            heat_index = 0.5 * (temp_max + 61.0 + ((temp_max - 68.0) * 1.2) + (humidity * 0.094))
        else:
            heat_index = temp_max
            
        risk_level = "Normal"
        health_advice = "No immediate heat-related health risks."
        
        if heat_index >= 54:
            risk_level = "Extreme Danger"
            health_advice = "CRITICAL: Heatstroke highly likely. Avoid all outdoor activity."
        elif heat_index >= 41:
            risk_level = "Danger"
            health_advice = "HIGH RISK: Heatstroke, heat cramps, or heat exhaustion likely. Limit outdoor exposure."
        elif heat_index >= 32:
            risk_level = "Extreme Caution"
            health_advice = "MODERATE RISK: Heatstroke possible with prolonged exposure. Stay hydrated."
        elif heat_index >= 27:
            risk_level = "Caution"
            health_advice = "LOW RISK: Fatigue possible with prolonged exposure."
            
        return {
            "heat_index_celsius": round(float(heat_index), 2),
            "health_risk_level": risk_level,
            "health_advice": health_advice
        }
    
    def predict_weather_stress(self, temp_max, temp_min):
        """Detect extreme weather events for crops."""
        alerts = []
        
        if temp_max > 40:
            alerts.append("Heatwave Warning: Extreme temperatures may damage crops.")
        if temp_min < 4:
            alerts.append("Frost Warning: Near-freezing temperatures detected. Protect sensitive saplings.")
        if (temp_max - temp_min) > 20:
            alerts.append("High Diurnal Variation: High temperature fluctuations can stress young plants.")
            
        return alerts if alerts else ["No extreme weather stress detected."]
