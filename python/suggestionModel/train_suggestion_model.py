
import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestRegressor

# Paths
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
MODELS_DIR = os.path.join(ROOT, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

FINAL_PROCESSED = os.path.join(DATA_DIR, 'finalProcessed.csv')
TREES_PROCESSED = os.path.join(DATA_DIR, 'treesprocessed.csv')

def train_model():
    print("Loading data for ML suggestion training...")
    df = pd.read_csv(FINAL_PROCESSED)
    trees = pd.read_csv(TREES_PROCESSED)
    
    # 1. Prepare Regional Profiles (Averages per location)
    regions = df.groupby(['city', 'lat', 'lon']).agg({
        'rainfall_30d': 'mean',
        'temp_max': 'mean',
        'pH': 'mean',
        'Texture_Code_encoded': 'mean'
    }).reset_index()
    
    # 2. Build training dataset via Cross-Join
    print(f"Building cross-join dataset from {len(regions)} regions and {len(trees)} species...")
    
    X = []
    y = []
    
    for _, r in regions.iterrows():
        for _, t in trees.iterrows():
            # Feature vector: [Region Features] + [Tree Requirement Features]
            feat = [
                r['rainfall_30d'], r['temp_max'], r['pH'], r['Texture_Code_encoded'], # Region
                t['min_rainfall_norm'], t['max_temp_norm'], t['ph_min_norm'], t['ph_max_norm'] # Tree Requirements
            ]
            X.append(feat)
            
            # Synthetic ground truth for "ideal" compatibility (used to prime the model)
            # Goal: Model learns to generalize these interactions
            dist = abs(r['rainfall_30d'] - t['min_rainfall_norm']) + \
                   abs(r['temp_max'] - t['max_temp_norm']) + \
                   abs(r['pH'] - (t['ph_min_norm'] + t['ph_max_norm'])/2)
            
            score = np.exp(-dist) # exponential decay for score (0 to 1)
            y.append(score)
            
    X = np.array(X)
    y = np.array(y)
    
    # 3. Train Random Forest Regressor
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # 4. Save Model
    model_path = os.path.join(MODELS_DIR, 'suggestion_rf_model.pkl')
    joblib.dump(model, model_path)
    print(f"✓ Suggestion model saved to {model_path}")

if __name__ == "__main__":
    train_model()
