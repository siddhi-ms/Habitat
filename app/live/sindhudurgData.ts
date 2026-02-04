// Sindhudurg land patch grid system
// Divides Sindhudurg into a grid for detailed environmental analysis

export type LandPatch = {
  id: string;
  center: [number, number]; // [lng, lat]
  rainfall_30d: number; // mm
  rainfall_90d: number; // mm
  avg_temp: number; // °C
  soil_carbon: number; // %
  soil_nitrogen: number; // %
  soil_ph: number;
  drought_index: number; // 0-100 (higher = more risk)
  heat_stress: number; // 0-100 (higher = more stress)
  fertility_score: number; // 0-100
  climate_risk_score: number; // 0-100
  suitability_score: number; // 0-100 (overall land viability)
};

// Generate grid patches for Sindhudurg
// Bounds: lng [73.3, 73.9], lat [15.6, 16.5]
function generateSindhudurgPatches(): LandPatch[] {
  const patches: LandPatch[] = [];
  const lngMin = 73.3;
  const lngMax = 73.9;
  const latMin = 15.6;
  const latMax = 16.5;
  
  // Create 10x10 grid (100 patches)
  const gridSize = 10;
  const lngStep = (lngMax - lngMin) / gridSize;
  const latStep = (latMax - latMin) / gridSize;
  
  let patchId = 0;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lng = lngMin + (i + 0.5) * lngStep;
      const lat = latMin + (j + 0.5) * latStep;
      
      // Generate realistic environmental data with variation
      // Coastal areas (west) have higher rainfall
      const coastalFactor = (lngMax - lng) / (lngMax - lngMin);
      
      // Elevation proxy (northern areas slightly higher)
      const elevationFactor = (lat - latMin) / (latMax - latMin);
      
      // Base rainfall (Sindhudurg is high rainfall zone)
      const rainfall_90d = 800 + coastalFactor * 600 + Math.random() * 200;
      const rainfall_30d = rainfall_90d * 0.35 + Math.random() * 50;
      
      // Temperature (tropical, coastal influence)
      const avg_temp = 26 + (1 - coastalFactor) * 3 + Math.random() * 2;
      
      // Soil properties (laterite soil typical of Konkan)
      const soil_carbon = 1.5 + coastalFactor * 1.2 + Math.random() * 0.8;
      const soil_nitrogen = 0.12 + coastalFactor * 0.08 + Math.random() * 0.05;
      const soil_ph = 5.5 + Math.random() * 0.8; // Laterite tends acidic
      
      // Calculate derived indices
      const drought_index = Math.max(0, 40 - coastalFactor * 35 + Math.random() * 15);
      const heat_stress = Math.max(0, (avg_temp - 25) * 4 + Math.random() * 10);
      
      // Fertility based on soil nutrients
      const fertility_score = Math.min(100, 
        (soil_carbon / 3.5) * 50 + 
        (soil_nitrogen / 0.25) * 50
      );
      
      // Climate risk (low for Sindhudurg generally)
      const climate_risk_score = (drought_index * 0.6 + heat_stress * 0.4);
      
      // Overall suitability
      const suitability_score = Math.min(100,
        fertility_score * 0.4 +
        (100 - climate_risk_score) * 0.3 +
        (rainfall_90d / 1400) * 100 * 0.3
      );
      
      patches.push({
        id: `SD-${String(patchId).padStart(3, '0')}`,
        center: [lng, lat],
        rainfall_30d: Math.round(rainfall_30d * 10) / 10,
        rainfall_90d: Math.round(rainfall_90d * 10) / 10,
        avg_temp: Math.round(avg_temp * 10) / 10,
        soil_carbon: Math.round(soil_carbon * 100) / 100,
        soil_nitrogen: Math.round(soil_nitrogen * 1000) / 1000,
        soil_ph: Math.round(soil_ph * 10) / 10,
        drought_index: Math.round(drought_index),
        heat_stress: Math.round(heat_stress),
        fertility_score: Math.round(fertility_score),
        climate_risk_score: Math.round(climate_risk_score),
        suitability_score: Math.round(suitability_score),
      });
      
      patchId++;
    }
  }
  
  return patches;
}

export const SINDHUDURG_PATCHES = generateSindhudurgPatches();

// Convert patches to GeoJSON for MapLibre
export function getSindhudurgPatchesGeoJSON() {
  const gridSize = 10;
  const lngMin = 73.3;
  const lngMax = 73.9;
  const latMin = 15.6;
  const latMax = 16.5;
  const lngStep = (lngMax - lngMin) / gridSize;
  const latStep = (latMax - latMin) / gridSize;
  
  return {
    type: "FeatureCollection" as const,
    features: SINDHUDURG_PATCHES.map((patch, idx) => {
      const i = Math.floor(idx / gridSize);
      const j = idx % gridSize;
      const lng = lngMin + i * lngStep;
      const lat = latMin + j * latStep;
      
      return {
        type: "Feature" as const,
        properties: { 
          ...patch,
          // Store center as separate properties for GeoJSON compatibility
          center_lng: patch.center[0],
          center_lat: patch.center[1],
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [lng, lat],
            [lng + lngStep, lat],
            [lng + lngStep, lat + latStep],
            [lng, lat + latStep],
            [lng, lat],
          ]],
        },
      };
    }),
  };
}

// Helper to get patch by ID
export function getPatchById(id: string): LandPatch | undefined {
  return SINDHUDURG_PATCHES.find(p => p.id === id);
}

// Color scale helpers for different environmental layers
export function getRainfallColor(rainfall_90d: number): string {
  if (rainfall_90d < 600) return "#fef08a"; // low (yellow)
  if (rainfall_90d < 900) return "#a7f3d0"; // medium (green)
  if (rainfall_90d < 1200) return "#6ee7b7"; // good (teal)
  return "#34d399"; // excellent (deep green)
}

export function getTemperatureColor(temp: number): string {
  if (temp < 24) return "#bae6fd"; // cool (blue)
  if (temp < 27) return "#a7f3d0"; // comfortable (green)
  if (temp < 30) return "#fef08a"; // warm (yellow)
  return "#fecaca"; // hot (red)
}

export function getSoilFertilityColor(fertility: number): string {
  if (fertility < 40) return "#fed7aa"; // low (orange)
  if (fertility < 65) return "#fef08a"; // medium (yellow)
  if (fertility < 80) return "#a7f3d0"; // good (green)
  return "#bbf7d0"; // high (bright green)
}

export function getClimateRiskColor(risk: number): string {
  if (risk < 25) return "#a7f3d0"; // low (green)
  if (risk < 50) return "#fef08a"; // moderate (yellow)
  if (risk < 70) return "#fed7aa"; // elevated (orange)
  return "#fecaca"; // high (red)
}

export function getSuitabilityColor(score: number): string {
  if (score < 40) return "#fecaca"; // poor (red)
  if (score < 60) return "#fef08a"; // fair (yellow)
  if (score < 75) return "#a7f3d0"; // good (green)
  return "#6ee7b7"; // excellent (teal)
}
