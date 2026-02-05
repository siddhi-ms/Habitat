"""
Simple preprocessing script to create a clean CSV.
Encodes Texture_Code and standardizes numerical features.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Load data
print("Loading data...")
df = pd.read_csv("./final.csv")

print(f"Original shape: {df.shape}")

# Handle Depth_cm column (format: "0-20" -> extract midpoint)
def extract_depth(depth_str):
    try:
        if isinstance(depth_str, str) and '-' in depth_str:
            parts = depth_str.split('-')
            return (float(parts[0]) + float(parts[1])) / 2
        else:
            return float(depth_str)
    except:
        return 10.0  # default midpoint

df['Depth_cm'] = df['Depth_cm'].apply(extract_depth)
print("✓ Converted Depth_cm from range to numeric")

# Encode Texture_Code
le_texture = LabelEncoder()
df['Texture_Code_encoded'] = le_texture.fit_transform(df['Texture_Code'].astype(str))
print(f"✓ Encoded Texture_Code: {dict(zip(le_texture.classes_, le_texture.transform(le_texture.classes_)))}")

# Convert date to datetime and extract features
df['date'] = pd.to_datetime(df['date'])
df['month'] = df['date'].dt.month
df['year'] = df['date'].dt.year
df['day_of_year'] = df['date'].dt.dayofyear
print("✓ Extracted temporal features from date")

# Handle missing values
missing_before = df.isnull().sum().sum()
if missing_before > 0:
    # Fill numerical with median
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    for col in numerical_cols:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    
    # Fill categorical with mode
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].mode()[0], inplace=True)
    
    print(f"✓ Handled {missing_before} missing values")

# Standardize numerical features (excluding target and identifiers, and lat/lon)
numerical_features = [
    'rainfall_weekly', 'rainfall_30d', 'rainfall_90d',
    'temp_mean', 'temp_max', 'temp_min', 'humidity_mean', 'wind_speed',
    'solar_radiation', 'et0', 'Depth_cm', 'pH',
    'Org_Carbon_pct', 'Nitrogen_pct', 'month', 'year', 'day_of_year',
    'Texture_Code_encoded'
]

# Save scale params for decoding API output (mean/std before scaling)
target_features = [
    'rainfall_weekly', 'rainfall_30d', 'rainfall_90d',
    'temp_mean', 'temp_max', 'temp_min', 'humidity_mean', 'wind_speed',
    'solar_radiation', 'et0', 'pH', 'Org_Carbon_pct', 'Nitrogen_pct', 'Depth_cm',
    'Texture_Code_encoded'
]
import json
import os
target_params = {}
for col in target_features:
    if col in df.columns:
        m, s = float(df[col].mean()), float(df[col].std())
        target_params[col] = {'mean': m, 'std': s if s != 0 else 1.0}
os.makedirs('data', exist_ok=True)
with open('data/target_scale_params.json', 'w') as f:
    json.dump(target_params, f, indent=2)
print("✓ Saved data/target_scale_params.json for decoding API output")

# Texture_Code: encoded -> name mapping for decoding
texture_mapping = {int(i): str(c) for i, c in enumerate(le_texture.classes_)}
with open('data/texture_encoding.json', 'w') as f:
    json.dump(texture_mapping, f, indent=2)
print("✓ Saved data/texture_encoding.json")

scaler = StandardScaler()
df[numerical_features] = scaler.fit_transform(df[numerical_features])
print(f"✓ Standardized {len(numerical_features)} numerical features")

# Drop original Texture_Code as we have the encoded version
if 'Texture_Code' in df.columns:
    df.drop(columns=['Texture_Code'], inplace=True)

output_path = 'data/finalProcessed.csv'
df.to_csv(output_path, index=False)

print(f"\n✅ Preprocessed data saved to: {output_path}")
print(f"Final shape: {df.shape}")
print(f"\nColumns in output:")
print(df.columns.tolist())