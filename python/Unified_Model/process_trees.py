"""
Preprocessing script for trees.csv.
Encodes species_name and saves as treesprocessed.csv.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import os

# Paths
input_path = os.path.join(os.path.dirname(__file__), '..', 'trees.csv')
output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'treesprocessed.csv')

print("Processing trees.csv...")
print(f"Input: {input_path}")
print(f"Output: {output_path}")

# Load data
df = pd.read_csv(input_path)

print(f"\nOriginal shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"\nSpecies names:")
print(df['species_name'].tolist())

# Create a copy for processing
df_processed = df.copy()

# Encode species_name
le_species = LabelEncoder()
df_processed['species_name_encoded'] = le_species.fit_transform(df_processed['species_name'])

# Create mapping dictionary for reference
species_mapping = dict(zip(le_species.classes_, le_species.transform(le_species.classes_)))
print(f"\nSpecies encoding mapping:")
for species, encoded in species_mapping.items():
    print(f"  {species}: {encoded}")

# Keep species_name for reference but add encoded version
# Optionally, you can drop species_name if you want only encoded version
# For now, we'll keep both for reference

# Reorder columns to have species_name_encoded first, then species_name, then rest
cols = ['species_name_encoded', 'species_name'] + [col for col in df_processed.columns 
                                                    if col not in ['species_name_encoded', 'species_name']]
df_processed = df_processed[cols]

# Save processed data
df_processed.to_csv(output_path, index=False)

print(f"\n[OK] Processed data saved to: {output_path}")
print(f"Final shape: {df_processed.shape}")
print(f"\nProcessed columns:")
print(df_processed.columns.tolist())
print(f"\nFirst few rows:")
print(df_processed.head())

# Save the label encoder mapping for later use
import json
mapping_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'species_encoding.json')
os.makedirs(os.path.dirname(mapping_path), exist_ok=True)
with open(mapping_path, 'w') as f:
    json.dump({
        'species_to_encoded': {k: int(v) for k, v in species_mapping.items()},
        'encoded_to_species': {str(int(v)): k for k, v in species_mapping.items()}
    }, f, indent=2)
print(f"\n[OK] Species encoding mapping saved to: {mapping_path}")
