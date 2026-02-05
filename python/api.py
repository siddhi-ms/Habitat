"""
Main API endpoint for GeoAI prediction service.
Combines Sentinel-2, Prithvi, and Random Forest models.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import pandas as pd
import numpy as np
import os
import sys
import re
import json

# Add Unified_Model to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Unified_Model'))

from Unified_Model.sentinel2_fetcher import Sentinel2Fetcher
from Unified_Model.prithvi_extractor import PrithviFeatureExtractor
from Unified_Model.rf_model import RandomForestPredictor
from warningModel.drought_model import DroughtWarningModel
from warningModel.weather_health_model import WeatherHealthModel

app = FastAPI(
    title="GeoAI Prediction API",
    description="Predict environmental and soil features from latitude/longitude using Sentinel-2, Prithvi, and Random Forest models",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances (loaded on startup)
sentinel_fetcher = None
prithvi_extractor = None
rf_predictor = None
warning_model = None
health_model = None
trees_df = None
target_scale_params = None
texture_encoding = None
RESULT_JSON_PATH = None  # set on startup
# Suggestion model data (region -> saplings, species -> regions)
best_saplings_for_regions = None
best_regions_for_saplings = None
regions_lat_lon = None  # list of (region_key, lat, lon) for nearest-neighbor


class PredictionRequest(BaseModel):
    """Request model for prediction endpoint."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate (-90 to 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate (-180 to 180)")
    sapling_type: Optional[str] = Field(default="Neem", description="Type of sapling/tree species")
    date: Optional[str] = Field(default=None, description="Date for prediction (YYYY-MM-DD format, defaults to today)")


class PredictionResponse(BaseModel):
    """Response model for prediction endpoint."""
    latitude: float
    longitude: float
    sapling_type: str
    prediction_date: str
    
    # Weather/Climate features
    rainfall_weekly: float
    rainfall_30d: float
    rainfall_90d: float
    temp_mean: float
    temp_max: float
    temp_min: float
    humidity_mean: float
    wind_speed: float
    solar_radiation: float
    et0: float
    
    # Soil features
    pH: float
    Org_Carbon_pct: float
    Nitrogen_pct: float
    Depth_cm: float
    Texture_Code_encoded: int
    Texture_Code: Optional[str] = None  # decoded texture name
    
    # Metadata and Analytics
    Sample_ID: Optional[str] = None
    Soil_Collection_Date: Optional[str] = None
    risk_rating: str
    risk_score: float
    survival_rate: float
    
    # Warning Analytics
    warning_analytics: Optional[dict] = None
    
    # Model metadata
    model_info: dict


class SuggestSaplingsRequest(BaseModel):
    """Request for sapling suggestions given a location."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class SuggestLocationsRequest(BaseModel):
    """Request for location suggestions given a species."""
    species: str = Field(..., min_length=1)


def load_decode_params():
    """Load target scale params and texture encoding for decoding API output."""
    global target_scale_params, texture_encoding
    base = os.path.dirname(__file__)
    import json
    p = os.path.join(base, 'data', 'target_scale_params.json')
    if os.path.exists(p):
        with open(p, 'r') as f:
            target_scale_params = json.load(f)
    else:
        target_scale_params = {}
    p = os.path.join(base, 'data', 'texture_encoding.json')
    if os.path.exists(p):
        with open(p, 'r') as f:
            texture_encoding = json.load(f)
    else:
        texture_encoding = {}


def decode_predictions(predictions):
    """Convert encoded (standardized) predictions to decoded (original scale) values."""
    global target_scale_params, texture_encoding
    if not target_scale_params:
        return predictions.copy(), None
    decoded = {}
    for k, v in predictions.items():
        if k in target_scale_params:
            params = target_scale_params[k]
            decoded[k] = float(v) * params['std'] + params['mean']
        else:
            decoded[k] = v
    # Texture_Code name from encoded value
    texture_name = None
    if texture_encoding and 'Texture_Code_encoded' in decoded:
        enc = int(round(decoded['Texture_Code_encoded']))
        texture_name = texture_encoding.get(str(enc), str(enc))
        decoded['Texture_Code_encoded'] = enc  # keep as int
    return decoded, texture_name


def load_trees_data():
    """Load and parse treesprocessed.csv data."""
    global trees_df
    trees_path = os.path.join(os.path.dirname(__file__), 'data', 'treesprocessed.csv')
    
    try:
        # Read processed CSV with encoded species_name
        trees_df = pd.read_csv(trees_path, skip_blank_lines=True)
        
        # Remove any rows that are completely empty
        trees_df = trees_df.dropna(how='all')
        
        # Ensure species_name is the index for easy lookup
        if 'species_name' in trees_df.columns:
            trees_df = trees_df.set_index('species_name')
        
        print(f"[OK] Loaded {len(trees_df)} tree species from treesprocessed.csv")
        return trees_df
    except Exception as e:
        print(f"Error loading treesprocessed.csv: {e}")
        # Return a default tree species if file can't be loaded
        return pd.DataFrame([{
            'min_rainfall_norm': 0.5,
            'max_temp_norm': 0.5,
            'ph_min_norm': 0.4,
            'ph_max_norm': 0.8,
            'drought_tol_norm': 0.5,
            'carbon_factor_norm': 0.7,
            'soil_sandy': 0,
            'soil_loamy': 1,
            'soil_clayey': 0,
            'growth_slow': 0,
            'growth_medium': 1,
            'growth_fast': 0,
            'root_shallow': 0,
            'root_medium': 0,
            'root_deep': 1,
            'shade_low': 0,
            'shade_medium': 1,
            'shade_high': 0
        }], index=['Neem'])


def calculate_survival_metrics(predictions, tree_species_data):
    """Calculate survival rate and risk from normalized predictions vs species norms.
    Uses capped contributions so scores stay in a realistic range (not always 100/0).
    """
    risk_score = 0.0
    cap = 25.0  # max per factor

    # Rainfall factor (25% weight) — normalized comparison, cap deficit
    rainfall_30d = float(predictions.get('rainfall_30d', 0.5))
    min_rainfall = float(tree_species_data.get('min_rainfall_norm', 0.5))
    if rainfall_30d < min_rainfall:
        deficit = min(1.0, (min_rainfall - rainfall_30d) / max(0.01, min_rainfall))
        risk_score += deficit * cap

    # Temperature factor (25% weight)
    temp_max = float(predictions.get('temp_max', 0.5))
    max_temp = float(tree_species_data.get('max_temp_norm', 0.5))
    if temp_max > max_temp:
        excess = min(1.0, (temp_max - max_temp) / max(0.01, 1.0 - max_temp))
        risk_score += excess * cap

    # pH factor (25% weight)
    pH = float(predictions.get('pH', 0.5))
    ph_min = float(tree_species_data.get('ph_min_norm', 0.4))
    ph_max = float(tree_species_data.get('ph_max_norm', 0.8))
    if pH < ph_min:
        deficit = min(1.0, (ph_min - pH) / max(0.01, ph_min))
        risk_score += deficit * cap
    elif pH > ph_max:
        excess = min(1.0, (pH - ph_max) / max(0.01, 1.0 - ph_max))
        risk_score += excess * cap

    # Soil/Nutrient factor (25% weight)
    carbon = float(predictions.get('Org_Carbon_pct', 0.5))
    nitrogen = float(predictions.get('Nitrogen_pct', 0.5))
    health_factor = (carbon + nitrogen) / 2
    if health_factor < 0.3:
        risk_score += min(cap, (0.3 - health_factor) * 50)

    risk_score = min(100.0, max(0.0, risk_score))
    survival_rate = 100.0 - risk_score

    if risk_score < 20:
        rating = "Low"
    elif risk_score < 50:
        rating = "Medium"
    else:
        rating = "High"

    return {
        "risk_score": round(risk_score, 2),
        "survival_rate": round(survival_rate, 2),
        "risk_rating": rating
    }


def calculate_survival_metrics_from_decoded(decoded):
    """Compute survival/risk from decoded (real-world) values for more realistic spread.
    Uses typical reforestation suitability ranges (rainfall mm, temp °C, pH, fertility).
    """
    rainfall_30d = float(decoded.get('rainfall_30d', 130))
    temp_max = float(decoded.get('temp_max', 32))
    pH = float(decoded.get('pH', 7.5))
    carbon = float(decoded.get('Org_Carbon_pct', 1.0))
    nitrogen = float(decoded.get('Nitrogen_pct', 0.08))

    # Suitability 0–100 per factor (higher = better for survival)
    # Rainfall: 0–50 mm poor, 50–200 moderate, 200–500 good, >500 very good
    if rainfall_30d <= 0:
        rain_score = 0
    elif rainfall_30d < 50:
        rain_score = rainfall_30d * 0.6
    elif rainfall_30d < 200:
        rain_score = 30 + (rainfall_30d - 50) * 0.4
    elif rainfall_30d < 500:
        rain_score = 90 + (rainfall_30d - 200) / 30
    else:
        rain_score = 100
    rain_score = min(100, max(0, rain_score))

    # Temp: 20–38 °C ideal; outside penalized
    if temp_max < 15 or temp_max > 42:
        temp_score = 20
    elif temp_max < 20 or temp_max > 38:
        temp_score = 50 + (20 - abs(temp_max - 29)) * 2.5
    else:
        temp_score = 70 + (18 - abs(temp_max - 29)) * 1.5
    temp_score = min(100, max(0, temp_score))

    # pH: 6–8.5 ideal
    if pH < 4.5 or pH > 9:
        ph_score = 20
    elif 6 <= pH <= 8.5:
        ph_score = 90
    else:
        ph_score = 50 + (8 - abs(pH - 7.25)) * 10
    ph_score = min(100, max(0, ph_score))

    # Fertility proxy from carbon + nitrogen (typical 0.5–2% C, 0.05–0.15% N)
    fertility = (min(carbon, 2) / 2 * 50) + (min(nitrogen, 0.2) / 0.2 * 50)
    fertility = min(100, max(0, fertility))

    survival_rate = (rain_score * 0.3 + temp_score * 0.25 + ph_score * 0.25 + fertility * 0.2)
    survival_rate = min(100.0, max(0.0, survival_rate))
    risk_score = 100.0 - survival_rate

    if risk_score < 20:
        rating = "Low"
    elif risk_score < 50:
        rating = "Medium"
    else:
        rating = "High"

    return {
        "risk_score": round(risk_score, 2),
        "survival_rate": round(survival_rate, 2),
        "risk_rating": rating
    }


def load_suggestion_data():
    """Load suggestion JSON files and build region index for nearest-neighbor."""
    global best_saplings_for_regions, best_regions_for_saplings, regions_lat_lon
    base = os.path.join(os.path.dirname(__file__), "suggestionModel")
    path_saplings = os.path.join(base, "best_saplings_for_regions.json")
    path_regions = os.path.join(base, "best_regions_for_saplings.json")
    if not os.path.exists(path_saplings) or not os.path.exists(path_regions):
        print("Warning: Suggestion JSON files not found. Suggestion endpoints will return empty.")
        best_saplings_for_regions = {}
        best_regions_for_saplings = {}
        regions_lat_lon = []
        return
    with open(path_saplings, "r") as f:
        best_saplings_for_regions = json.load(f)
    with open(path_regions, "r") as f:
        best_regions_for_saplings = json.load(f)
    # Parse "City (lat, lon)" -> (region_key, lat, lon)
    pattern = re.compile(r"^.+ \(([-\d.]+),\s*([-\d.]+)\)$")
    regions_lat_lon = []
    for key in best_saplings_for_regions:
        m = pattern.match(key)
        if m:
            lat, lon = float(m.group(1)), float(m.group(2))
            regions_lat_lon.append((key, lat, lon))
    print(f"[OK] Loaded suggestions: {len(best_saplings_for_regions)} regions, {len(best_regions_for_saplings)} species")


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup."""
    global sentinel_fetcher, prithvi_extractor, rf_predictor, warning_model, health_model, trees_df
    
    print("Initializing GeoAI models...")
    
    # Initialize Sentinel-2 fetcher
    print("Loading Sentinel-2 fetcher...")
    sentinel_fetcher = Sentinel2Fetcher()
    
    # Initialize Prithvi extractor
    print("Loading Prithvi feature extractor...")
    try:
        prithvi_extractor = PrithviFeatureExtractor()
    except Exception as e:
        print(f"Warning: Could not load Prithvi model: {e}")
        print("API will use mock features")
        prithvi_extractor = None
    
    # Load trees data
    trees_df = load_trees_data()
    # Load decode params for output
    load_decode_params()
    
    # Configure results directory
    results_dir = os.path.join(os.path.dirname(__file__), 'results')
    os.makedirs(results_dir, exist_ok=True)
    global RESULT_JSON_PATH
    RESULT_JSON_PATH = os.path.join(results_dir, 'result.json')
    
    # Initialize Random Forest predictor
    print("Loading Random Forest model...")
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'rf_model.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler.pkl')
    
    rf_predictor = RandomForestPredictor()
    
    # Try to load existing model, otherwise train a new one
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            rf_predictor.load_model(model_path, scaler_path)
        except Exception as e:
            print(f"Error loading RF model: {e}")
            print("Attempting to continue without a pre-loaded model...")
    else:
        print("No saved model found. Training new model...")
        final_processed_path = os.path.join(os.path.dirname(__file__), 'data', 'finalProcessed.csv')
        trees_path = os.path.join(os.path.dirname(__file__), 'data', 'treesprocessed.csv')
        
        rf_predictor.train(final_processed_path, trees_path)
        
        # Save the model
        os.makedirs(os.path.join(os.path.dirname(__file__), 'models'), exist_ok=True)
        rf_predictor.save_model(model_path, scaler_path)
    
    # Initialize Warning Model
    print("Loading Drought Warning Model...")
    warning_model = DroughtWarningModel()
    
    # Initialize Health/Weather Alerts Model
    print("Loading Weather Health Model...")
    health_model = WeatherHealthModel()
    
    # Load suggestion data for location/species suggestions
    load_suggestion_data()
    
    print("✓ All models initialized successfully")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "GeoAI Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "/predict": "POST - Get predictions for latitude/longitude",
            "/warnings": "POST - Get warning analytics only (drought, health, weather)",
            "/suggestions/saplings": "POST - Suggest saplings for a location",
            "/suggestions/locations": "POST - Suggest locations for a species",
            "/health": "GET - Health check",
            "/docs": "GET - API documentation"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "models_loaded": {
            "sentinel_fetcher": sentinel_fetcher is not None,
            "prithvi_extractor": prithvi_extractor is not None,
            "rf_predictor": rf_predictor is not None and rf_predictor.model is not None,
            "trees_data": trees_df is not None and len(trees_df) > 0
        }
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict environmental and soil features for given coordinates.
    
    Workflow:
    1. Fetch Sentinel-2 satellite image for lat/long
    2. Extract features using Prithvi model
    3. Combine with tree species data and location
    4. Predict features using Random Forest model
    """
    try:
        # Parse date
        if request.date:
            try:
                pred_date = datetime.strptime(request.date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            pred_date = datetime.now()
        
        # Get tree species data
        sapling_type = request.sapling_type or "Neem"
        if sapling_type not in trees_df.index:
            # Use first available species if not found
            sapling_type = trees_df.index[0]
            print(f"Warning: Sapling type not found, using {sapling_type}")
        
        tree_species_data = trees_df.loc[sapling_type].to_dict()
        
        # Step 1: Fetch Sentinel-2 image
        print(f"Fetching Sentinel-2 image for lat={request.latitude}, lon={request.longitude}")
        satellite_image = sentinel_fetcher.fetch_image(
            request.latitude,
            request.longitude,
            size=(224, 224)
        )
        
        # Step 2: Extract features using Prithvi
        print("Extracting features using Prithvi model...")
        try:
            if prithvi_extractor:
                prithvi_features = prithvi_extractor.extract_features(satellite_image)
            else:
                raise ValueError("Prithvi extractor not initialized")
        except Exception as e:
            print(f"Warning: Prithvi feature extraction failed: {e}")
            print("Using mock Prithvi features as fallback...")
            # Use random noise of dimension 100 as fallback
            prithvi_features = np.random.rand(100).astype(np.float32)
            print("✓ Generated mock Prithvi features")
        
        # Step 3: Predict using Random Forest
        print("Predicting features using Random Forest...")
        predictions = rf_predictor.predict(
            prithvi_features=prithvi_features,
            latitude=request.latitude,
            longitude=request.longitude,
            tree_species_data=tree_species_data,
            date=pred_date
        )
        
        # Decode to original scale (and get texture name)
        decoded, texture_name = decode_predictions(predictions)

        # Step 4: Run Warning Model (Drought Analytics)
        print("Calculating warning analytics...")
        warning_info = None
        if warning_model:
            warning_info = warning_model.predict_drought_risk(predictions, tree_species_data)
            
        # Step 5: Run Health/Weather Alerts
        print("Calculating health and weather alerts...")
        health_info = None
        weather_stress = None
        if health_model:
            # Need decoded temp and humidity for heat index
            t_max = float(decoded.get('temp_max', 25))
            hum = float(decoded.get('humidity_mean', 50))
            t_min = float(decoded.get('temp_min', 15))
            
            health_info = health_model.predict_health_risks(t_max, hum)
            weather_stress = health_model.predict_weather_stress(t_max, t_min)
            
            # Combine into a single analytic block
            if warning_info:
                warning_info["health_risk"] = health_info
                warning_info["weather_alerts"] = weather_stress
        
        # Risk and Survival Metrics from decoded (real-world) values for realistic spread
        metrics = calculate_survival_metrics_from_decoded(decoded)
        risk_rating = metrics["risk_rating"]
        risk_score = metrics["risk_score"]
        survival_rate = metrics["survival_rate"]
        
        # Generate sample ID (based on location)
        sample_id = f"S_{int(request.latitude * 100)}_{int(request.longitude * 100)}"
        
        # Build response dict for JSON and response model
        response_dict = {
            "latitude": request.latitude,
            "longitude": request.longitude,
            "sapling_type": sapling_type,
            "prediction_date": pred_date.strftime("%Y-%m-%d"),
            "rainfall_weekly": round(decoded["rainfall_weekly"], 4),
            "rainfall_30d": round(decoded["rainfall_30d"], 4),
            "rainfall_90d": round(decoded["rainfall_90d"], 4),
            "temp_mean": round(decoded["temp_mean"], 4),
            "temp_max": round(decoded["temp_max"], 4),
            "temp_min": round(decoded["temp_min"], 4),
            "humidity_mean": round(decoded["humidity_mean"], 4),
            "wind_speed": round(decoded["wind_speed"], 4),
            "solar_radiation": round(decoded["solar_radiation"], 4),
            "et0": round(decoded["et0"], 4),
            "pH": round(decoded["pH"], 4),
            "Org_Carbon_pct": round(decoded["Org_Carbon_pct"], 4),
            "Nitrogen_pct": round(decoded["Nitrogen_pct"], 4),
            "Depth_cm": round(decoded["Depth_cm"], 4),
            "Texture_Code_encoded": int(decoded["Texture_Code_encoded"]),
            "Texture_Code": texture_name,
            "Sample_ID": sample_id,
            "Soil_Collection_Date": pred_date.strftime("%Y-%m-%d"),
            "risk_rating": risk_rating,
            "risk_score": risk_score,
            "survival_rate": survival_rate,
            "warning_analytics": warning_info,
            "model_info": {
                "sentinel2_used": sentinel_fetcher.use_sentinelhub,
                "prithvi_used": prithvi_extractor is not None,
                "rf_model_loaded": rf_predictor.model is not None
            }
        }
        
        # Save result to result.json
        if RESULT_JSON_PATH:
            import json
            try:
                with open(RESULT_JSON_PATH, 'w') as f:
                    json.dump(response_dict, f, indent=2)
                print(f"Result saved to {RESULT_JSON_PATH}")
            except Exception as e:
                print(f"Could not save result.json: {e}")
        
        response = PredictionResponse(**response_dict)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/suggestions/saplings")
async def suggest_saplings(request: SuggestSaplingsRequest):
    """
    Suggest best sapling species for a given location (lat/lng).
    Uses precomputed ML suggestions; finds nearest region and returns top species.
    """
    if not regions_lat_lon or not best_saplings_for_regions:
        return {"saplings": [], "message": "Suggestion data not loaded."}
    lat, lon = request.latitude, request.longitude
    best_key = None
    best_dist = float("inf")
    for region_key, rlat, rlon in regions_lat_lon:
        dist = (lat - rlat) ** 2 + (lon - rlon) ** 2
        if dist < best_dist:
            best_dist = dist
            best_key = region_key
    if best_key is None:
        return {"saplings": []}
    saplings = best_saplings_for_regions.get(best_key, [])
    return {"region": best_key, "saplings": saplings}


@app.post("/suggestions/locations")
async def suggest_locations(request: SuggestLocationsRequest):
    """
    Suggest best locations (regions) for a given species.
    Returns top regions with compatibility scores.
    """
    if not best_regions_for_saplings:
        return {"locations": [], "message": "Suggestion data not loaded."}
    species = request.species.strip()
    # Try exact match first, then capitalize
    if species not in best_regions_for_saplings:
        species_cap = species.capitalize()
        if species_cap in best_regions_for_saplings:
            species = species_cap
        else:
            return {"locations": [], "message": f"Species '{request.species}' not found."}
    locations = best_regions_for_saplings.get(species, [])
    return {"species": species, "locations": locations}


@app.post("/warnings")
async def get_warnings(request: PredictionRequest):
    """
    Run the full prediction pipeline and return only warning analytics
    (drought risk, health risk, weather alerts). Use when you need to
    trigger the warning model without displaying full prediction data.
    """
    try:
        response = await predict(request)
        return {"warning_analytics": response.warning_analytics}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Warning analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)
