# GeoAI Prediction Workflow

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                              │
│  • Latitude (float)                                             │
│  • Longitude (float)                                            │
│  • Sapling Type (string, optional, default: "Neem")            │
│  • Date (string, optional, default: today)                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 1: SENTINEL-2 IMAGE FETCHER                   │
│  • Input: latitude, longitude                                   │
│  • Output: Satellite image (6 bands, 224x224)                   │
│  • Bands: B02, B03, B04, B08, B11, B12                         │
│  • Uses Sentinel Hub API (or mock if not configured)           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 2: PRITHVI FEATURE EXTRACTOR                  │
│  • Input: Sentinel-2 image (6, 224, 224)                       │
│  • Model: Prithvi-EO-2.0-100M-TL                                │
│  • Output: Feature vector (flattened deep learning features)    │
│  • Extracts semantic features from satellite imagery            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: DATA INTEGRATION                            │
│  Combines:                                                       │
│  • Prithvi features (from Step 2)                               │
│  • Tree species data (from treesprocessed.csv)                  │
│    - min_rainfall_norm, max_temp_norm                           │
│    - ph_min_norm, ph_max_norm                                   │
│    - drought_tol_norm, carbon_factor_norm                       │
│    - soil type (sandy/loamy/clayey)                             │
│    - growth rate (slow/medium/fast)                             │
│    - root depth (shallow/medium/deep)                           │
│    - shade tolerance (low/medium/high)                          │
│  • Location features (lat, lon, month, year, day_of_year)      │
│  • Historical patterns (from finalProcessed.csv)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│          STEP 4: RANDOM FOREST PREDICTION                       │
│  • Model: RandomForestRegressor (100 trees, max_depth=20)        │
│  • Input: Combined feature vector                               │
│  • Output: Predicted environmental and soil features            │
│  • Trained on: finalProcessed.csv + treesprocessed.csv         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 5: RISK ASSESSMENT                            │
│  Compares predicted values with tree species requirements:      │
│  • Rainfall vs. minimum required                                │
│  • Temperature vs. maximum tolerated                            │
│  • pH vs. optimal range                                         │
│  • Output: Risk Rating (Low/Medium/High)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API RESPONSE                               │
│  Returns:                                                        │
│  • Weather features (rainfall, temp, humidity, etc.)           │
│  • Soil features (pH, carbon, nitrogen, depth, texture)         │
│  • Risk rating                                                   │
│  • Metadata (sample ID, dates, model info)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Input Data Sources

1. **User Input** (API Request)
   - Coordinates: latitude, longitude
   - Tree species: sapling_type
   - Date: prediction date

2. **Sentinel-2 Satellite Imagery**
   - Fetched in real-time or from cache
   - 6 spectral bands at 224x224 resolution

3. **Historical Dataset** (`finalProcessed.csv`)
   - 9,659 samples
   - Features: weather, soil, temporal data
   - Used for training Random Forest model

4. **Tree Species Database** (`treesprocessed.csv`)
   - Contains encoded `species_name_encoded` column
   - Generated from `trees.csv` using `Unified_Model/process_trees.py`
   - 10 tree species
   - Characteristics: rainfall needs, temperature tolerance, soil preferences, etc.

### Processing Steps

1. **Image Acquisition** → Sentinel-2 fetcher
2. **Feature Extraction** → Prithvi model
3. **Feature Engineering** → Combine all data sources
4. **Prediction** → Random Forest model
5. **Post-processing** → Risk assessment, formatting

### Output Features

The model predicts 15 features:

**Weather/Climate (10 features):**
- rainfall_weekly, rainfall_30d, rainfall_90d
- temp_mean, temp_max, temp_min
- humidity_mean, wind_speed, solar_radiation, et0

**Soil Properties (5 features):**
- pH, Org_Carbon_pct, Nitrogen_pct, Depth_cm, Texture_Code_encoded

**Derived Metrics:**
- Risk Rating (Low/Medium/High)
- Sample_ID (generated)
- Soil_Collection_Date

## Model Architecture

### Prithvi Model
- **Type**: Vision Transformer (ViT) backbone
- **Input**: 6-band Sentinel-2 image (6, 224, 224)
- **Output**: Feature vector (~100-1000 dimensions)
- **Purpose**: Extract semantic features from satellite imagery

### Random Forest Model
- **Type**: Random Forest Regressor
- **Parameters**: 
  - n_estimators: 100
  - max_depth: 20
  - min_samples_split: 5
  - min_samples_leaf: 2
- **Input Features**: 
  - Prithvi features (~100 dims)
  - Tree species features (18 dims)
  - Location/temporal features (5 dims)
  - Total: ~123 features
- **Output**: 15 predicted features
- **Training**: Uses all samples from finalProcessed.csv

## Performance Considerations

- **Sentinel-2 Fetching**: 2-5 seconds (or instant with mock)
- **Prithvi Extraction**: 1-3 seconds (GPU) or 5-10 seconds (CPU)
- **Random Forest Prediction**: <1 second
- **Total API Response Time**: 3-9 seconds (depending on hardware)

## Scalability

- Models are loaded once on startup
- Predictions are stateless and can be parallelized
- Random Forest model is lightweight and fast
- Prithvi model benefits from GPU acceleration
- Sentinel Hub API has rate limits (consider caching)
