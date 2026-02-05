"""
Sentinel-2 satellite image fetcher using Sentinel Hub API or eo-learn.
Fetches satellite imagery for given latitude and longitude coordinates.
"""

import numpy as np
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Try to use sentinelhub if available, otherwise use a mock implementation
try:
    from sentinelhub import SentinelHubRequest, DataCollection, MimeType, CRS, BBox, bbox_to_dimensions, SHConfig
    SENTINELHUB_AVAILABLE = True
except ImportError as e:
    SENTINELHUB_AVAILABLE = False
    print(f"Warning: sentinelhub not installed. Exception: {e}")
    print("Using mock implementation.")

load_dotenv()


class Sentinel2Fetcher:
    """Fetches Sentinel-2 satellite images for given coordinates."""
    
    def __init__(self, instance_id=None, sh_client_id=None, sh_client_secret=None):
        """
        Initialize Sentinel-2 fetcher.
        
        Args:
            instance_id: Sentinel Hub instance ID (optional)
            sh_client_id: Sentinel Hub client ID (optional)
            sh_client_secret: Sentinel Hub client secret (optional)
        """
        self.instance_id = os.getenv('SENTINELHUB_INSTANCE_ID') or instance_id 
        self.sh_client_id = os.getenv('SENTINELHUB_CLIENT_ID') or sh_client_id 
        self.sh_client_secret = os.getenv('SENTINELHUB_CLIENT_SECRET') or sh_client_secret 
        self.use_sentinelhub = SENTINELHUB_AVAILABLE and bool(self.instance_id) and bool(self.sh_client_id) and bool(self.sh_client_secret)
        
        if not self.use_sentinelhub:
            print("Sentinel Hub credentials not found or package missing. Using mock implementation.")
        else:
            print("Sentinel Hub credentials found. Using real satellite data.")
        
    def fetch_image(self, latitude, longitude, size=(224, 224), buffer=0.01, date=None):
        """
        Fetch Sentinel-2 image for given coordinates.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            size: Output image size (width, height) in pixels
            buffer: Buffer around point in degrees (default 0.01 ~ 1km)
            date: Date for image (default: most recent available)
            
        Returns:
            numpy array of shape (6, height, width) representing Sentinel-2 bands
            Bands: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR1), B12 (SWIR2)
        """
        if self.use_sentinelhub:
            return self._fetch_from_sentinelhub(latitude, longitude, size, buffer, date)
        else:
            return self._fetch_mock_image(latitude, longitude, size)
    
    def _fetch_from_sentinelhub(self, latitude, longitude, size, buffer, date):
        """Fetch image using Sentinel Hub API."""
        # Create bounding box around the point
        bbox = BBox(
            bbox=[longitude - buffer, latitude - buffer, longitude + buffer, latitude + buffer],
            crs=CRS.WGS84
        )
        
        # Calculate resolution
        resolution = (buffer * 2) / size[0]  # degrees per pixel
        
        # Set time interval (use recent date if not specified)
        if date is None:
            time_interval = (datetime.now() - timedelta(days=30), datetime.now())
        else:
            time_interval = (date, date + timedelta(days=1))
        
        # Define evalscript for Sentinel-2 bands
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: [{
                    bands: ["B02", "B03", "B04", "B08", "B11", "B12"],
                    units: "DN"
                }],
                output: {
                    bands: 6,
                    sampleType: "UINT16"
                }
            };
        }
        
        function evaluatePixel(sample) {
            return [sample.B02, sample.B03, sample.B04, sample.B08, sample.B11, sample.B12];
        }
        """
        
        # Create request
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=time_interval
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=size,
            config=SHConfig(
                instance_id=self.instance_id,
                sh_client_id=self.sh_client_id,
                sh_client_secret=self.sh_client_secret
            )
        )
        
        # Execute request
        data = request.get_data()[0]
        
        # Normalize to [0, 1] range and transpose to (6, H, W)
        data = np.array(data).astype(np.float32)
        data = np.transpose(data, (2, 0, 1))  # (H, W, 6) -> (6, H, W)
        data = data / 10000.0  # Normalize from 16-bit to [0, 1]
        
        return data
    
    def _fetch_mock_image(self, latitude, longitude, size):
        """
        Generate a mock Sentinel-2 image for testing purposes.
        In production, this should be replaced with actual Sentinel Hub API calls.
        """
        print(f"Warning: Using mock Sentinel-2 image for lat={latitude}, lon={longitude}")
        
        # Generate mock 6-band image (B02, B03, B04, B08, B11, B12)
        # Simulate realistic values based on location
        np.random.seed(int(latitude * 1000 + longitude * 1000))
        
        # Create base image with some spatial variation
        height, width = size[1], size[0]
        image = np.zeros((6, height, width), dtype=np.float32)
        
        for i in range(6):
            # Generate spatially correlated noise
            base = np.random.rand(height, width) * 0.3 + 0.2
            # Add some structure
            x = np.linspace(0, 2*np.pi, width)
            y = np.linspace(0, 2*np.pi, height)
            X, Y = np.meshgrid(x, y)
            pattern = np.sin(X + i) * np.cos(Y + i) * 0.1
            image[i] = np.clip(base + pattern, 0, 1)
        
        return image


if __name__ == "__main__":
    # Test the fetcher
    fetcher = Sentinel2Fetcher()
    image = fetcher.fetch_image(19.076, 72.8777, size=(224, 224))
    print(f"Fetched image shape: {image.shape}")
    print(f"Image value range: [{image.min():.3f}, {image.max():.3f}]")
