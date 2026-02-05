"""
Prithvi model feature extractor.
Extracts features from Sentinel-2 satellite images using Prithvi-EO model.
"""

import torch
import numpy as np
from terratorch.registry import BACKBONE_REGISTRY
import os
from dotenv import load_dotenv

load_dotenv()


class PrithviFeatureExtractor:
    """Extracts features from satellite images using Prithvi model."""
    
    def __init__(self, model_name="prithvi_eo_v2_100_tl", device=None):
        """
        Initialize Prithvi feature extractor.
        
        Args:
            model_name: Name of the Prithvi model to use
            device: Device to run model on ('cuda' or 'cpu'). Auto-detects if None.
        """
        self.model_name = model_name
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the Prithvi model."""
        print(f"Loading Prithvi model: {self.model_name}")
        print(f"Using device: {self.device}")
        
        # Set HuggingFace token if available
        hf_token = os.getenv('HF_TOKEN')
        if hf_token:
            os.environ['HF_TOKEN'] = hf_token
        
        try:
            self.model = BACKBONE_REGISTRY.build(
                self.model_name,
                pretrained=True
            )
            self.model = self.model.to(self.device)
            self.model.eval()
            print("✓ Prithvi model loaded successfully")
        except Exception as e:
            print(f"Error loading Prithvi model: {e}")
            raise
    
    def extract_features(self, image_array):
        """
        Extract features from satellite image.
        
        Args:
            image_array: numpy array of shape (6, H, W) representing Sentinel-2 bands
                        Values should be in [0, 1] range
            
        Returns:
            numpy array of extracted features (flattened feature vector)
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call _load_model() first.")
        
        # Convert to tensor and add batch dimension
        if isinstance(image_array, np.ndarray):
            image_tensor = torch.from_numpy(image_array).float()
        else:
            image_tensor = image_array.float()
        
        # Ensure shape is (1, 6, H, W)
        if image_tensor.dim() == 3:
            image_tensor = image_tensor.unsqueeze(0)
        
        # Move to device
        image_tensor = image_tensor.to(self.device)
        
        # Extract features
        with torch.no_grad():
            features = self.model(image_tensor)
            
            # Handle different output formats
            if isinstance(features, (list, tuple)):
                # If multiple feature maps, use the last one or concatenate
                features = features[-1]
            
            # Flatten features
            features = features.view(features.size(0), -1)
            
            # Convert back to numpy
            features_np = features.cpu().numpy().flatten()
        
        return features_np
    
    def extract_features_batch(self, image_arrays):
        """
        Extract features from multiple images.
        
        Args:
            image_arrays: list of numpy arrays or single array of shape (N, 6, H, W)
            
        Returns:
            numpy array of shape (N, feature_dim)
        """
        if isinstance(image_arrays, list):
            # Stack into batch
            batch = np.stack(image_arrays, axis=0)
        else:
            batch = image_arrays
        
        # Convert to tensor
        batch_tensor = torch.from_numpy(batch).float().to(self.device)
        
        # Extract features
        with torch.no_grad():
            features = self.model(batch_tensor)
            
            if isinstance(features, (list, tuple)):
                features = features[-1]
            
            features = features.view(features.size(0), -1)
            features_np = features.cpu().numpy()
        
        return features_np


if __name__ == "__main__":
    # Test the extractor
    extractor = PrithviFeatureExtractor()
    
    # Create dummy image
    dummy_image = np.random.rand(6, 224, 224).astype(np.float32)
    
    # Extract features
    features = extractor.extract_features(dummy_image)
    print(f"Extracted features shape: {features.shape}")
    print(f"Feature statistics: mean={features.mean():.4f}, std={features.std():.4f}")
