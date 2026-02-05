
import json
import os

# Setup paths
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUGGESTION_DIR = os.path.join(ROOT, 'suggestionModel')

def run_suggestion_demo():
    print("="*60)
    print("DEMO: SMART ML-BASED CROP & REGION SUGGESTIONS")
    print("="*60)
    print("Powered by: Random Forest Regressor (suggestion_rf_model.pkl)")
    
    # 1. Best Saplings for a specific region
    region_file = os.path.join(SUGGESTION_DIR, 'best_saplings_for_regions.json')
    if os.path.exists(region_file):
        with open(region_file, 'r') as f:
            data = json.load(f)
            
        print("\n[SCENARIO 1] ML-Recommended Crops for Mumbai (19.076, 72.8777)")
        print("-"*60)
        
        # Note: Key format is "City (Lat, Lon)"
        mumbai_key = "Mumbai (19.076, 72.8777)"
        if mumbai_key in data:
            for i, item in enumerate(data[mumbai_key], 1):
                print(f"{i}. {item['species']:<10} | ML-Predict Match: {item['compatibility_score']}%")
        else:
            print("Location data not found in pre-computed list.")
            
    # 2. Best Regions for a specific sapling
    sapling_file = os.path.join(SUGGESTION_DIR, 'best_regions_for_saplings.json')
    if os.path.exists(sapling_file):
        with open(sapling_file, 'r') as f:
            data = json.load(f)
            
        print("\n[SCENARIO 2] ML-Ranked Top 5 Regions for Mango Plantation")
        print("-"*60)
        
        if "Mango" in data:
            for i, item in enumerate(data["Mango"], 1):
                print(f"{i}. {item['region']:<12} | Score: {item['compatibility_score']}% | Lat/Lon: {item['latitude']}, {item['longitude']}")
        else:
            print("Species 'Mango' not found in pre-computed list.")

    print("\nBENEFITS FOR JUDGES:")
    print("1. ML-Derived Insights: Goes beyond simple math by learning biological patterns.")
    print("2. Instant Recommendations: Using pre-computed ML inference results.")
    print("3. Bidirectional Discovery: Smart matching for both farmers and land-owners.")
    print("="*60)

if __name__ == "__main__":
    run_suggestion_demo()
