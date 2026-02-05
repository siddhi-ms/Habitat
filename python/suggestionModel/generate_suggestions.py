
import pandas as pd
import numpy as np
import json
import os
import joblib

# Paths
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, 'data', 'finalProcessed.csv')
TREES_PATH = os.path.join(ROOT, 'data', 'treesprocessed.csv')
MODEL_PATH = os.path.join(ROOT, 'models', 'suggestion_rf_model.pkl')
OUTPUT_DIR = os.path.join(ROOT, 'suggestionModel')

def main():
    print("Loading data and ML model...")
    df = pd.read_csv(DATA_PATH)
    trees = pd.read_csv(TREES_PATH)
    
    if not os.path.exists(MODEL_PATH):
        print("Error: Suggestion model not found. Run train_suggestion_model.py first.")
        return
        
    model = joblib.load(MODEL_PATH)
    
    # 1. Prepare Regional Profiles
    regions = df.groupby(['city', 'lat', 'lon']).agg({
        'rainfall_30d': 'mean',
        'temp_max': 'mean',
        'pH': 'mean',
        'Texture_Code_encoded': 'mean'
    }).reset_index()
    
    best_saplings_for_regions = {}
    best_regions_for_saplings = {row['species_name']: [] for _, row in trees.iterrows()}
    
    print(f"Running ML inference for {len(regions)} regions...")
    
    for _, r in regions.iterrows():
        region_key = f"{r['city']} ({r['lat']}, {r['lon']})"
        scores = []
        
        for _, t in trees.iterrows():
            # Feature vector matches the trainer:
            # [rainfall, temp, ph, texture, min_rain, max_temp, ph_min, ph_max]
            X_input = np.array([[
                r['rainfall_30d'], r['temp_max'], r['pH'], r['Texture_Code_encoded'],
                t['min_rainfall_norm'], t['max_temp_norm'], t['ph_min_norm'], t['ph_max_norm']
            ]])
            
            # Predict compatibility using ML model
            comp_score = model.predict(X_input)[0]
            comp_pct = round(comp_score * 100, 2)
            
            scores.append({
                "species": t['species_name'],
                "compatibility_score": comp_pct
            })
            
            best_regions_for_saplings[t['species_name']].append({
                "region": r['city'],
                "latitude": r['lat'],
                "longitude": r['lon'],
                "compatibility_score": comp_pct
            })
            
        # Sort and take top 5
        scores.sort(key=lambda x: x['compatibility_score'], reverse=True)
        best_saplings_for_regions[region_key] = scores[:5]
        
    # Sort regions per sapling and take top 5
    final_regions_for_saplings = {}
    for species, reg_list in best_regions_for_saplings.items():
        reg_list.sort(key=lambda x: x['compatibility_score'], reverse=True)
        final_regions_for_saplings[species] = reg_list[:5]
        
    # Save results
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(os.path.join(OUTPUT_DIR, 'best_saplings_for_regions.json'), 'w') as f:
        json.dump(best_saplings_for_regions, f, indent=2)
        
    with open(os.path.join(OUTPUT_DIR, 'best_regions_for_saplings.json'), 'w') as f:
        json.dump(final_regions_for_saplings, f, indent=2)
        
    print(f"✓ ML Suggestions generated successfully in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
