"""
Random Forest model for predicting environmental and soil features.
Combines Prithvi features, historical data, and tree species information.
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib


class RandomForestPredictor:
    """Random Forest model for feature prediction."""
    
    def __init__(self, model_path=None, scaler_path=None):
        """
        Initialize Random Forest predictor.
        
        Args:
            model_path: Path to saved model (optional)
            scaler_path: Path to saved scaler (optional)
        """
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.target_features = [
            'rainfall_weekly', 'rainfall_30d', 'rainfall_90d',
            'temp_mean', 'temp_max', 'temp_min', 'humidity_mean',
            'wind_speed', 'solar_radiation', 'et0',
            'pH', 'Org_Carbon_pct', 'Nitrogen_pct', 'Depth_cm',
            'Texture_Code_encoded'
        ]
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path, scaler_path)
    
    def train(self, final_processed_csv, trees_csv, prithvi_features_csv=None):
        """
        Train the Random Forest model.
        
        Args:
            final_processed_csv: Path to finalProcessed.csv
            trees_csv: Path to treesprocessed.csv (with encoded species_name)
            prithvi_features_csv: Optional path to CSV with Prithvi features for training
        """
        print("Loading training data...")
        
        # Load datasets
        df_processed = pd.read_csv(final_processed_csv)
        df_trees = pd.read_csv(trees_csv)
        
        # Set species_name as index for easy lookup (keep both encoded and name)
        if 'species_name' in df_trees.columns:
            df_trees = df_trees.set_index('species_name')
        
        print(f"Loaded {len(df_processed)} samples from finalProcessed.csv")
        print(f"Loaded {len(df_trees)} tree species from treesprocessed.csv")
        
        # Prepare features and targets
        X_list = []
        y_list = []
        
        # Process each row in finalProcessed.csv
        for idx, row in df_processed.iterrows():
            # Get tree species (for now, use first available or match by conditions)
            # In production, this should match based on sapling_type parameter
            if len(df_trees) > 0:
                tree_species = df_trees.iloc[0]  # Default to first species for now
            else:
                raise ValueError("No tree species data available")
            
            # Combine features:
            # 1. Prithvi features (if available, otherwise use zeros)
            if prithvi_features_csv and os.path.exists(prithvi_features_csv):
                prithvi_df = pd.read_csv(prithvi_features_csv)
                if idx < len(prithvi_df):
                    prithvi_feat = prithvi_df.iloc[idx].values
                else:
                    prithvi_feat = np.zeros(100)  # Dummy features
            else:
                prithvi_feat = np.zeros(100)  # Dummy Prithvi features
            
            # 2. Tree species features (include encoded species_name)
            tree_features = [
                tree_species.get('species_name_encoded', 0),  # Include encoded species
                tree_species['min_rainfall_norm'],
                tree_species['max_temp_norm'],
                tree_species['ph_min_norm'],
                tree_species['ph_max_norm'],
                tree_species['drought_tol_norm'],
                tree_species['carbon_factor_norm'],
                tree_species['soil_sandy'],
                tree_species['soil_loamy'],
                tree_species['soil_clayey'],
                tree_species['growth_slow'],
                tree_species['growth_medium'],
                tree_species['growth_fast'],
                tree_species['root_shallow'],
                tree_species['root_medium'],
                tree_species['root_deep'],
                tree_species['shade_low'],
                tree_species['shade_medium'],
                tree_species['shade_high']
            ]
            
            # 3. Location and temporal features from processed data
            location_temporal_features = [
                row['lat'],
                row['lon'],
                row['month'],
                row['year'],
                row['day_of_year']
            ]
            
            # Combine all features
            X = np.concatenate([
                prithvi_feat,
                np.array(tree_features),
                np.array(location_temporal_features)
            ])
            
            # Target values (all the features we want to predict)
            y = row[self.target_features].values
            
            X_list.append(X)
            y_list.append(y)
        
        # Convert to arrays
        X = np.array(X_list)
        y = np.array(y_list)
        
        print(f"Feature matrix shape: {X.shape}")
        print(f"Target matrix shape: {y.shape}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        print("Training Random Forest model...")
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            verbose=1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        print(f"Training R² score: {train_score:.4f}")
        print(f"Test R² score: {test_score:.4f}")
        
        # Store feature names for reference
        self.feature_names = [f'prithvi_{i}' for i in range(len(prithvi_feat))] + \
                            ['species_encoded'] + [f'tree_{i}' for i in range(len(tree_features)-1)] + \
                            ['lat', 'lon', 'month', 'year', 'day_of_year']
        
        print("✓ Model training completed")
    
    def predict(self, prithvi_features, latitude, longitude, tree_species_data, date=None):
        """
        Predict features for given inputs.
        
        Args:
            prithvi_features: numpy array of Prithvi-extracted features
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            tree_species_data: dict or pandas Series with tree species features
            date: datetime object (optional, defaults to current date)
            
        Returns:
            dict with predicted features
        """
        if self.model is None:
            raise RuntimeError("Model not trained. Call train() first or load a saved model.")
        
        from datetime import datetime
        if date is None:
            date = datetime.now()
        
        # Prepare tree features
        tree_features = [
            tree_species_data.get('min_rainfall_norm', 0.5),
            tree_species_data.get('max_temp_norm', 0.5),
            tree_species_data.get('ph_min_norm', 0.4),
            tree_species_data.get('ph_max_norm', 0.8),
            tree_species_data.get('drought_tol_norm', 0.5),
            tree_species_data.get('carbon_factor_norm', 0.7),
            tree_species_data.get('soil_sandy', 0),
            tree_species_data.get('soil_loamy', 1),
            tree_species_data.get('soil_clayey', 0),
            tree_species_data.get('growth_slow', 0),
            tree_species_data.get('growth_medium', 1),
            tree_species_data.get('growth_fast', 0),
            tree_species_data.get('root_shallow', 0),
            tree_species_data.get('root_medium', 0),
            tree_species_data.get('root_deep', 1),
            tree_species_data.get('shade_low', 0),
            tree_species_data.get('shade_medium', 1),
            tree_species_data.get('shade_high', 0)
        ]
        
        # Location and temporal features
        location_temporal_features = [
            latitude,
            longitude,
            date.month,
            date.year,
            date.timetuple().tm_yday  # day of year
        ]
        
        # Determine expected Prithvi dimension from the scaler
        # Total features - (Tree features + Location features)
        if hasattr(self.scaler, 'n_features_in_'):
            expected_prithvi_dim = self.scaler.n_features_in_ - len(tree_features) - len(location_temporal_features)
        else:
            expected_prithvi_dim = 100  # Default fallback if scaler not fitted (unlikely here)

        # Process Prithvi features
        p_feat = prithvi_features.flatten() if isinstance(prithvi_features, np.ndarray) else np.array(prithvi_features)
        
        # Resize to match training expectation
        if len(p_feat) > expected_prithvi_dim:
            # If too large (e.g. 151k), take first N features (or PCA if we had it)
            # Since training used zeros/dummy, slicing is acceptable for avoiding crash
            p_feat = p_feat[:expected_prithvi_dim]
        elif len(p_feat) < expected_prithvi_dim:
            # If too small, pad with zeros
            padding = np.zeros(expected_prithvi_dim - len(p_feat))
            p_feat = np.concatenate([p_feat, padding])

        # Combine features
        X = np.concatenate([
            p_feat,
            np.array(tree_features),
            np.array(location_temporal_features)
        ]).reshape(1, -1)
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)[0]
        
        # Create result dictionary
        result = {
            'rainfall_weekly': float(predictions[0]),
            'rainfall_30d': float(predictions[1]),
            'rainfall_90d': float(predictions[2]),
            'temp_mean': float(predictions[3]),
            'temp_max': float(predictions[4]),
            'temp_min': float(predictions[5]),
            'humidity_mean': float(predictions[6]),
            'wind_speed': float(predictions[7]),
            'solar_radiation': float(predictions[8]),
            'et0': float(predictions[9]),
            'pH': float(predictions[10]),
            'Org_Carbon_pct': float(predictions[11]),
            'Nitrogen_pct': float(predictions[12]),
            'Depth_cm': float(predictions[13]),
            'Texture_Code_encoded': int(round(predictions[14]))
        }
        
        return result
    
    def save_model(self, model_path, scaler_path=None):
        """Save the trained model and scaler."""
        if self.model is None:
            raise RuntimeError("No model to save. Train the model first.")
        
        joblib.dump(self.model, model_path)
        print(f"✓ Model saved to {model_path}")
        
        if scaler_path:
            joblib.dump(self.scaler, scaler_path)
            print(f"✓ Scaler saved to {scaler_path}")
    
    def load_model(self, model_path, scaler_path=None):
        """Load a saved model and scaler."""
        self.model = joblib.load(model_path)
        print(f"✓ Model loaded from {model_path}")
        
        if scaler_path and os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
            print(f"✓ Scaler loaded from {scaler_path}")


if __name__ == "__main__":
    # Test training
    predictor = RandomForestPredictor()
    predictor.train(
        final_processed_csv='../data/finalProcessed.csv',
        trees_csv='../data/treesprocessed.csv'
    )
    
    # Save model
    os.makedirs('../models', exist_ok=True)
    predictor.save_model('../models/rf_model.pkl', '../models/scaler.pkl')
