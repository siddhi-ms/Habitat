# GeoAI Prediction API

A comprehensive workflow that combines Sentinel-2 satellite imagery, Prithvi deep learning model, and Random Forest to predict environmental and soil features for any given latitude/longitude coordinates.

## Workflow Overview

1. **Input**: User provides latitude, longitude, and sapling type
2. **Sentinel-2**: Fetches satellite image for the given coordinates
3. **Prithvi Model**: Extracts deep learning features from the satellite image
4. **Data Integration**: Combines Prithvi features with historical data (`finalProcessed.csv`) and tree species data (`treesprocessed.csv`)
5. **Random Forest**: Predicts environmental and soil features
6. **Output**: Returns comprehensive prediction including weather, soil, and risk assessment

## Project Structure

```
geoai-project/
├── api.py                          # Main FastAPI endpoint
├── Unified_Model/
│   ├── sentinel2_fetcher.py       # Sentinel-2 image fetcher
│   ├── prithvi_extractor.py       # Prithvi feature extractor
│   └── rf_model.py                # Random Forest model
├── data/
│   ├── finalProcessed.csv         # Historical environmental/soil data
├── trees.csv                      # Tree species characteristics (source)
├── data/
│   ├── treesprocessed.csv         # Processed trees data with encoded species_name
│   └── species_encoding.json      # Species name encoding mapping (for decoding in output)
├── models/                        # Saved model files (created after training)
├── daily_runner.py                # Daily scheduler: weather + warning model (daily) + drought (every 21 days)
├── train_warning_model.py        # Train warning model on finalProcessed + treesprocessed
├── warning_predictor.py          # Current + warning prediction from API + model
├── model_state.json              # Last drought run date (created/updated by daily_runner)
├── requirements.txt               # Python dependencies
├── .env                          # Environment variables (API keys)
└── SAMPLE_API_OUTPUT.md          # API documentation with examples
```

## Installation

1. **Clone the repository** (if applicable)

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set up environment variables** (optional):
Create a `.env` file with:
```
HF_TOKEN=your_huggingface_token
SENTINELHUB_INSTANCE_ID=your_instance_id
SENTINELHUB_CLIENT_ID=your_client_id
SENTINELHUB_CLIENT_SECRET=your_client_secret
OPENWEATHER_API_KEY=your_openweathermap_api_key   # For daily_runner.py weather API
DEFAULT_LAT=19.076                                # Optional; default lat for daily_runner
DEFAULT_LON=72.8777                               # Optional; default lon for daily_runner
```

Note: The API will work with mock data if Sentinel Hub credentials are not provided.

## Usage

### Start the API Server

```bash
python api.py
```

Or using uvicorn directly:
```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Endpoints

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `POST /predict` - Main prediction endpoint

### Example Request

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.076,
    "longitude": 72.8777,
    "sapling_type": "Neem",
    "date": "2024-02-05"
  }'
```

### Example Response

See `SAMPLE_API_OUTPUT.md` for detailed response structure and field descriptions.

## Daily Runner (Scheduler)

Run once per day (e.g. via cron or Task Scheduler):

```bash
python daily_runner.py
```

- **Task A (every run)**:
  1. Calls OpenWeatherMap weather API for the default or given lat/lon → **current prediction** (from API).
  2. Runs the **warning model** (trained on `finalProcessed.csv` + `treesprocessed.csv`) using API data + location + tree → **warning prediction** (drought risk 0/1 and probability).
  Set `OPENWEATHER_API_KEY` in `.env` for live data. Train the warning model once with: `python train_warning_model.py`.
- **Task B (every 21 days)**: Runs the Drought Model by calling `main()` from `check_model_e2e.py`. The last run date is stored in `model_state.json`. If fewer than 21 days have passed, it prints: `Skipping Drought Model (Last run: YYYY-MM-DD; runs every 21 days)`.

Override lat/lon and sapling type:

```bash
python daily_runner.py --lat 19.076 --lon 72.8777 --sapling_type Neem
```

## Model Training

The Random Forest model is automatically trained on first startup if no saved model exists. The training process:

1. Loads data from `data/finalProcessed.csv` and `data/treesprocessed.csv`
2. Combines Prithvi features (or mock features), tree species data, and location/temporal features
3. Trains a Random Forest regressor to predict environmental and soil features
4. Saves the model to `models/rf_model.pkl` and scaler to `models/scaler.pkl`

Training typically takes 2-5 minutes depending on your hardware.

## Features Predicted

The API predicts the following features:

### Weather/Climate
- Rainfall (weekly, 30-day, 90-day)
- Temperature (mean, max, min)
- Humidity
- Wind speed
- Solar radiation
- Evapotranspiration (ET0)

### Soil Properties
- pH
- Organic carbon percentage
- Nitrogen percentage
- Depth
- Texture code

### Risk Assessment
- Risk rating (Low/Medium/High) based on environmental conditions vs. tree species requirements

## Available Tree Species

- Neem
- Banyan
- Peepal
- Teak
- Sal
- Arjun
- Amla
- Bamboo
- Jamun
- Mango

## Output: Decoding species for display

For printed/output data, `species_name_encoded` can be decoded to the species name using `data/species_encoding.json`. Use `decode_species_for_output(encoded_value)` from `Unified_Model/species_decoder.py`. Run the test file to check decoded output:

```bash
python test_output_decoded.py
```

## Development

### Testing Individual Components

**Test Sentinel-2 Fetcher**:
```bash
python Unified_Model/sentinel2_fetcher.py
```

**Test Prithvi Extractor**:
```bash
python Unified_Model/prithvi_extractor.py
```

**Test Random Forest Model**:
```bash
python Unified_Model/rf_model.py
```

## Notes

- **Normalized Values**: Most numerical outputs are standardized (mean=0, std=1). These are the same format as in `finalProcessed.csv`.
- **Mock Data**: If Sentinel Hub is not configured, mock satellite images are used for testing.
- **Model Persistence**: Trained models are saved and reused on subsequent API starts for faster initialization.
- **GPU Support**: The Prithvi model will automatically use GPU if available, otherwise falls back to CPU.

## Troubleshooting

1. **Import Errors**: Make sure all dependencies are installed: `pip install -r requirements.txt`
2. **Model Loading Errors**: Delete `models/` directory to retrain the model
3. **Memory Issues**: Reduce `n_estimators` in `rf_model.py` if training fails
4. **Prithvi Model Errors**: Ensure `HF_TOKEN` is set in `.env` file

## License

[Add your license here]
