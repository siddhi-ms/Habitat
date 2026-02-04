export type FertilityIndex = "Low" | "Medium" | "High";
export type ClimateRisk = "Low" | "Moderate" | "High";

export type IndiaStateProps = {
  name: string;
  avg_rainfall: number; // mm/year
  soil_type: string;
  climate_zone: string;
};

export type DistrictProps = {
  name: string;
  avg_rainfall: number; // representative mm/year
  rainfall_range: string; // display
  soil_type: string;
  fertility_index: FertilityIndex;
  climate_risk: ClimateRisk;
  vegetation_score: number; // 0..100, explainable from attributes
};

type Feature<G, P> = {
  type: "Feature";
  properties: P;
  geometry: G;
};

type Polygon = { type: "Polygon"; coordinates: number[][][] };
type FeatureCollection<G, P> = {
  type: "FeatureCollection";
  features: Array<Feature<G, P>>;
};

// NOTE: More realistic demo geometries with natural boundaries.
// Attributes are plausible and the UI reads ONLY from properties.
export const INDIA_STATES_GEOJSON: FeatureCollection<Polygon, IndiaStateProps> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Maharashtra",
        avg_rainfall: 900,
        soil_type: "Black Cotton Soil",
        climate_zone: "Tropical Wet & Dry",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.6, 20.1], [72.8, 19.8], [72.9, 19.3], [73.0, 18.9],
            [73.3, 18.5], [73.5, 18.0], [73.7, 17.5], [74.0, 17.0],
            [74.3, 16.5], [74.5, 16.0], [75.0, 15.6], [75.5, 15.8],
            [76.0, 16.2], [76.5, 16.5], [77.0, 17.0], [77.5, 17.5],
            [78.0, 18.0], [78.5, 18.5], [79.0, 19.0], [79.5, 19.3],
            [80.0, 19.5], [80.5, 19.8], [80.8, 20.2], [80.9, 20.5],
            [80.5, 20.8], [80.0, 21.0], [79.5, 21.2], [79.0, 21.3],
            [78.5, 21.5], [78.0, 21.6], [77.5, 21.5], [77.0, 21.3],
            [76.5, 21.2], [76.0, 21.0], [75.5, 20.8], [75.0, 20.6],
            [74.5, 20.5], [74.0, 20.4], [73.5, 20.3], [73.0, 20.2],
            [72.6, 20.1]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Gujarat",
        avg_rainfall: 800,
        soil_type: "Alluvial / Sandy Loam",
        climate_zone: "Arid to Semi-arid",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [68.2, 23.5], [68.5, 24.0], [69.0, 24.3], [69.5, 24.5],
            [70.0, 24.6], [70.5, 24.5], [71.0, 24.3], [71.5, 24.0],
            [72.0, 23.5], [72.3, 23.0], [72.5, 22.5], [72.6, 22.0],
            [72.6, 21.5], [72.6, 21.0], [72.6, 20.5], [72.5, 20.1],
            [72.0, 20.3], [71.5, 20.5], [71.0, 20.6], [70.5, 20.7],
            [70.0, 20.8], [69.5, 20.8], [69.0, 20.7], [68.5, 20.5],
            [68.2, 20.8], [68.0, 21.2], [68.0, 21.7], [68.0, 22.2],
            [68.0, 22.7], [68.1, 23.0], [68.2, 23.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Madhya Pradesh",
        avg_rainfall: 1050,
        soil_type: "Black Soil / Red & Yellow",
        climate_zone: "Subtropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.0, 26.5], [74.5, 26.3], [75.0, 26.0], [75.5, 25.8],
            [76.0, 25.5], [76.5, 25.3], [77.0, 25.0], [77.5, 24.8],
            [78.0, 24.6], [78.5, 24.5], [79.0, 24.4], [79.5, 24.3],
            [80.0, 24.3], [80.5, 24.4], [81.0, 24.5], [81.5, 24.6],
            [82.0, 24.8], [82.5, 25.0], [82.8, 25.3], [82.7, 25.5],
            [82.5, 25.8], [82.3, 26.0], [82.0, 26.2], [81.5, 26.3],
            [81.0, 26.4], [80.5, 26.5], [80.0, 26.5], [79.5, 26.4],
            [79.0, 26.2], [78.5, 26.0], [78.3, 25.5], [78.0, 25.0],
            [77.8, 24.5], [77.5, 24.0], [77.3, 23.5], [77.0, 23.0],
            [76.8, 22.5], [76.5, 22.2], [76.2, 22.0], [75.8, 21.8],
            [75.5, 21.6], [75.2, 21.5], [74.8, 21.5], [74.5, 21.6],
            [74.2, 21.8], [74.0, 22.0], [74.0, 22.5], [74.0, 23.0],
            [74.0, 23.5], [74.0, 24.0], [74.0, 24.5], [74.0, 25.0],
            [74.0, 25.5], [74.0, 26.0], [74.0, 26.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Karnataka",
        avg_rainfall: 1200,
        soil_type: "Red Soil / Laterite",
        climate_zone: "Tropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.0, 18.4], [74.5, 18.3], [75.0, 18.2], [75.5, 18.0],
            [76.0, 17.8], [76.5, 17.5], [77.0, 17.2], [77.5, 17.0],
            [78.0, 16.8], [78.3, 16.5], [78.5, 16.0], [78.6, 15.5],
            [78.6, 15.0], [78.5, 14.5], [78.3, 14.0], [78.0, 13.5],
            [77.7, 13.0], [77.5, 12.5], [77.2, 12.2], [76.8, 12.0],
            [76.5, 11.8], [76.0, 11.6], [75.5, 11.5], [75.0, 11.6],
            [74.5, 11.8], [74.2, 12.0], [74.0, 12.3], [74.0, 12.8],
            [74.0, 13.3], [74.0, 13.8], [74.0, 14.3], [74.0, 14.8],
            [74.0, 15.3], [74.0, 15.8], [74.0, 16.3], [74.0, 16.8],
            [74.0, 17.3], [74.0, 17.8], [74.0, 18.4]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Telangana",
        avg_rainfall: 950,
        soil_type: "Red Sandy / Black Soil",
        climate_zone: "Tropical Semi-arid",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2, 19.9], [77.5, 19.8], [78.0, 19.7], [78.5, 19.6],
            [79.0, 19.5], [79.5, 19.4], [80.0, 19.3], [80.5, 19.2],
            [81.0, 19.1], [81.0, 18.8], [81.0, 18.5], [81.0, 18.2],
            [81.0, 17.9], [81.0, 17.6], [81.0, 17.3], [81.0, 17.0],
            [80.8, 16.8], [80.5, 16.6], [80.0, 16.5], [79.5, 16.4],
            [79.0, 16.3], [78.5, 16.3], [78.0, 16.4], [77.7, 16.5],
            [77.5, 16.7], [77.3, 17.0], [77.2, 17.3], [77.2, 17.6],
            [77.2, 18.0], [77.2, 18.4], [77.2, 18.8], [77.2, 19.2],
            [77.2, 19.6], [77.2, 19.9]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Rajasthan",
        avg_rainfall: 550,
        soil_type: "Sandy / Arid",
        climate_zone: "Arid to Semi-arid",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [69.5, 30.2], [70.0, 30.0], [70.5, 29.8], [71.0, 29.5],
            [71.5, 29.2], [72.0, 29.0], [72.5, 28.8], [73.0, 28.5],
            [73.5, 28.2], [74.0, 28.0], [74.5, 27.8], [75.0, 27.5],
            [75.5, 27.2], [76.0, 27.0], [76.5, 26.8], [77.0, 26.7],
            [77.5, 26.6], [78.0, 26.5], [78.2, 26.3], [78.0, 26.0],
            [77.7, 25.7], [77.5, 25.4], [77.2, 25.2], [76.8, 25.0],
            [76.5, 24.8], [76.0, 24.6], [75.5, 24.5], [75.0, 24.4],
            [74.5, 24.4], [74.0, 24.5], [73.5, 24.6], [73.0, 24.8],
            [72.5, 25.0], [72.0, 25.2], [71.5, 25.4], [71.0, 25.6],
            [70.5, 25.9], [70.0, 26.2], [69.8, 26.5], [69.7, 26.9],
            [69.6, 27.3], [69.5, 27.7], [69.5, 28.2], [69.5, 28.7],
            [69.5, 29.2], [69.5, 29.7], [69.5, 30.2]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Uttar Pradesh",
        avg_rainfall: 900,
        soil_type: "Alluvial",
        climate_zone: "Subtropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.0, 30.3], [77.5, 30.2], [78.0, 30.1], [78.5, 30.0],
            [79.0, 29.9], [79.5, 29.8], [80.0, 29.7], [80.5, 29.6],
            [81.0, 29.5], [81.5, 29.4], [82.0, 29.3], [82.5, 29.2],
            [83.0, 29.1], [83.5, 29.0], [84.0, 28.9], [84.2, 28.7],
            [84.0, 28.4], [83.7, 28.0], [83.5, 27.5], [83.3, 27.0],
            [83.0, 26.5], [82.7, 26.0], [82.5, 25.5], [82.2, 25.2],
            [81.8, 25.0], [81.5, 24.8], [81.0, 24.7], [80.5, 24.6],
            [80.0, 24.6], [79.5, 24.7], [79.0, 24.8], [78.5, 25.0],
            [78.0, 25.2], [77.8, 25.5], [77.5, 25.8], [77.3, 26.2],
            [77.2, 26.6], [77.0, 27.0], [77.0, 27.5], [77.0, 28.0],
            [77.0, 28.5], [77.0, 29.0], [77.0, 29.5], [77.0, 30.0],
            [77.0, 30.3]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Tamil Nadu",
        avg_rainfall: 950,
        soil_type: "Red / Black Soil",
        climate_zone: "Tropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.2, 13.5], [76.5, 13.3], [77.0, 13.0], [77.5, 12.7],
            [78.0, 12.5], [78.5, 12.3], [79.0, 12.0], [79.5, 11.8],
            [80.0, 11.5], [80.3, 11.2], [80.5, 10.8], [80.6, 10.4],
            [80.5, 10.0], [80.3, 9.6], [80.0, 9.2], [79.7, 8.9],
            [79.3, 8.7], [79.0, 8.5], [78.5, 8.2], [78.2, 8.1],
            [77.8, 8.1], [77.5, 8.2], [77.2, 8.4], [77.0, 8.7],
            [76.8, 9.0], [76.7, 9.4], [76.6, 9.8], [76.7, 10.2],
            [76.8, 10.6], [77.0, 11.0], [77.2, 11.4], [77.3, 11.8],
            [77.2, 12.2], [77.0, 12.6], [76.8, 12.9], [76.5, 13.2],
            [76.2, 13.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Kerala",
        avg_rainfall: 3000,
        soil_type: "Laterite / Alluvial",
        climate_zone: "Tropical Monsoon",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.8, 12.8], [75.2, 12.5], [75.5, 12.2], [75.8, 11.9],
            [76.0, 11.6], [76.2, 11.3], [76.4, 11.0], [76.5, 10.7],
            [76.6, 10.4], [76.7, 10.0], [76.8, 9.6], [76.8, 9.2],
            [76.7, 8.8], [76.6, 8.5], [76.4, 8.2], [76.2, 8.0],
            [75.9, 7.9], [75.6, 8.0], [75.3, 8.2], [75.1, 8.5],
            [75.0, 8.9], [75.0, 9.3], [75.0, 9.7], [75.0, 10.1],
            [75.0, 10.5], [75.0, 10.9], [75.0, 11.3], [75.0, 11.7],
            [75.0, 12.1], [75.2, 12.4], [75.4, 12.6], [75.6, 12.7],
            [76.0, 12.8], [76.4, 12.8], [76.7, 12.7], [76.8, 12.5],
            [76.5, 12.3], [76.2, 12.2], [75.8, 12.3], [75.4, 12.5],
            [75.0, 12.7], [74.8, 12.8]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Andhra Pradesh",
        avg_rainfall: 950,
        soil_type: "Red / Black / Alluvial",
        climate_zone: "Tropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.8, 19.0], [77.2, 18.8], [77.7, 18.5], [78.2, 18.2],
            [78.7, 18.0], [79.2, 17.8], [79.7, 17.5], [80.2, 17.2],
            [80.7, 17.0], [81.2, 16.8], [81.7, 16.5], [82.2, 16.2],
            [82.7, 16.0], [83.2, 15.8], [83.7, 15.6], [84.0, 15.4],
            [84.2, 15.0], [84.3, 14.5], [84.3, 14.0], [84.2, 13.5],
            [84.0, 13.2], [83.7, 13.0], [83.3, 12.9], [82.8, 12.8],
            [82.3, 12.8], [81.8, 12.9], [81.3, 13.1], [80.8, 13.3],
            [80.3, 13.6], [79.8, 13.9], [79.3, 14.2], [78.8, 14.5],
            [78.3, 14.8], [77.8, 15.1], [77.5, 15.4], [77.3, 15.8],
            [77.2, 16.2], [77.2, 16.6], [77.2, 17.0], [77.0, 17.4],
            [76.8, 17.8], [76.8, 18.2], [76.8, 18.6], [76.8, 19.0]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Odisha",
        avg_rainfall: 1450,
        soil_type: "Red / Laterite",
        climate_zone: "Tropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [81.5, 22.5], [82.0, 22.3], [82.5, 22.0], [83.0, 21.8],
            [83.5, 21.5], [84.0, 21.3], [84.5, 21.0], [85.0, 20.8],
            [85.5, 20.5], [86.0, 20.3], [86.5, 20.0], [87.0, 19.8],
            [87.2, 19.5], [87.3, 19.0], [87.2, 18.5], [87.0, 18.0],
            [86.7, 17.7], [86.3, 17.5], [85.8, 17.5], [85.3, 17.6],
            [84.8, 17.8], [84.3, 18.0], [83.8, 18.3], [83.3, 18.6],
            [82.8, 19.0], [82.3, 19.4], [81.8, 19.8], [81.5, 20.2],
            [81.3, 20.6], [81.2, 21.0], [81.2, 21.5], [81.3, 22.0],
            [81.5, 22.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "West Bengal",
        avg_rainfall: 1600,
        soil_type: "Alluvial / Red Laterite",
        climate_zone: "Tropical / Subtropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [85.8, 27.5], [86.2, 27.3], [86.7, 27.0], [87.2, 26.7],
            [87.7, 26.4], [88.2, 26.2], [88.7, 26.0], [89.0, 25.8],
            [89.2, 25.5], [89.3, 25.0], [89.2, 24.5], [89.0, 24.0],
            [88.7, 23.6], [88.4, 23.2], [88.0, 22.9], [87.6, 22.6],
            [87.2, 22.4], [86.8, 22.2], [86.4, 22.1], [86.0, 22.0],
            [85.6, 22.0], [85.2, 22.1], [84.8, 22.3], [84.5, 22.6],
            [84.3, 23.0], [84.2, 23.4], [84.2, 23.8], [84.3, 24.3],
            [84.5, 24.7], [84.7, 25.1], [85.0, 25.5], [85.3, 25.9],
            [85.6, 26.3], [85.8, 26.7], [85.9, 27.1], [85.8, 27.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Bihar",
        avg_rainfall: 1100,
        soil_type: "Alluvial",
        climate_zone: "Subtropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [83.3, 27.0], [83.8, 26.8], [84.3, 26.6], [84.8, 26.4],
            [85.3, 26.2], [85.8, 26.0], [86.3, 25.8], [86.8, 25.6],
            [87.3, 25.4], [87.8, 25.2], [88.2, 25.0], [88.4, 24.7],
            [88.5, 24.3], [88.4, 24.0], [88.2, 23.7], [87.9, 23.5],
            [87.5, 23.4], [87.0, 23.4], [86.5, 23.5], [86.0, 23.7],
            [85.5, 24.0], [85.0, 24.3], [84.5, 24.6], [84.0, 24.9],
            [83.5, 25.2], [83.2, 25.5], [83.0, 25.9], [83.0, 26.3],
            [83.2, 26.7], [83.3, 27.0]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Jharkhand",
        avg_rainfall: 1400,
        soil_type: "Red / Laterite",
        climate_zone: "Subtropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [83.3, 25.3], [83.8, 25.1], [84.3, 24.9], [84.8, 24.7],
            [85.3, 24.5], [85.8, 24.3], [86.3, 24.1], [86.8, 23.9],
            [87.2, 23.7], [87.5, 23.4], [87.6, 23.0], [87.5, 22.6],
            [87.3, 22.2], [87.0, 21.9], [86.6, 21.6], [86.2, 21.4],
            [85.7, 21.3], [85.2, 21.3], [84.7, 21.4], [84.2, 21.6],
            [83.7, 21.9], [83.3, 22.2], [83.0, 22.6], [82.8, 23.0],
            [82.7, 23.5], [82.8, 24.0], [83.0, 24.5], [83.2, 24.9],
            [83.3, 25.3]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Chhattisgarh",
        avg_rainfall: 1300,
        soil_type: "Red / Yellow",
        climate_zone: "Tropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.3, 24.0], [80.8, 23.8], [81.3, 23.6], [81.8, 23.4],
            [82.3, 23.2], [82.8, 23.0], [83.3, 22.8], [83.8, 22.6],
            [84.3, 22.4], [84.8, 22.2], [85.2, 22.0], [85.5, 21.7],
            [85.7, 21.3], [85.8, 20.9], [85.7, 20.5], [85.5, 20.1],
            [85.2, 19.8], [84.8, 19.5], [84.3, 19.3], [83.8, 19.2],
            [83.3, 19.2], [82.8, 19.3], [82.3, 19.5], [81.8, 19.8],
            [81.3, 20.1], [80.8, 20.5], [80.5, 20.9], [80.3, 21.3],
            [80.2, 21.7], [80.2, 22.2], [80.2, 22.7], [80.3, 23.2],
            [80.3, 23.7], [80.3, 24.0]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Goa",
        avg_rainfall: 3000,
        soil_type: "Laterite / Alluvial",
        climate_zone: "Tropical Monsoon",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.7, 15.8], [74.0, 15.7], [74.3, 15.5], [74.5, 15.3],
            [74.6, 15.0], [74.6, 14.7], [74.5, 14.5], [74.3, 14.3],
            [74.0, 14.2], [73.7, 14.2], [73.5, 14.3], [73.4, 14.5],
            [73.4, 14.7], [73.5, 15.0], [73.6, 15.3], [73.7, 15.6],
            [73.7, 15.8]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Punjab",
        avg_rainfall: 600,
        soil_type: "Alluvial",
        climate_zone: "Semi-arid",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.9, 32.5], [74.4, 32.3], [74.9, 32.0], [75.4, 31.7],
            [75.9, 31.4], [76.4, 31.1], [76.9, 30.8], [77.2, 30.5],
            [77.0, 30.2], [76.7, 30.0], [76.4, 29.8], [76.0, 29.7],
            [75.6, 29.7], [75.2, 29.8], [74.8, 30.0], [74.5, 30.3],
            [74.3, 30.6], [74.2, 31.0], [74.2, 31.4], [74.3, 31.8],
            [74.5, 32.1], [74.7, 32.3], [75.0, 32.4], [75.4, 32.5],
            [75.8, 32.5], [76.2, 32.4], [76.5, 32.3], [76.7, 32.1],
            [76.5, 31.9], [76.2, 31.7], [75.8, 31.6], [75.4, 31.6],
            [75.0, 31.7], [74.6, 31.9], [74.3, 32.1], [73.9, 32.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Haryana",
        avg_rainfall: 550,
        soil_type: "Alluvial / Sandy",
        climate_zone: "Semi-arid",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.5, 30.5], [75.0, 30.3], [75.5, 30.0], [76.0, 29.7],
            [76.5, 29.4], [77.0, 29.2], [77.5, 29.0], [77.8, 28.7],
            [77.9, 28.3], [77.8, 28.0], [77.5, 27.7], [77.2, 27.5],
            [76.8, 27.4], [76.4, 27.4], [76.0, 27.5], [75.6, 27.7],
            [75.3, 28.0], [75.1, 28.4], [75.0, 28.8], [75.0, 29.2],
            [75.1, 29.6], [75.3, 30.0], [75.6, 30.3], [76.0, 30.5],
            [76.3, 30.6], [76.6, 30.5], [76.8, 30.3], [76.7, 30.0],
            [76.4, 29.7], [76.0, 29.5], [75.6, 29.4], [75.2, 29.4],
            [74.8, 29.5], [74.5, 29.7], [74.3, 30.0], [74.5, 30.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Himachal Pradesh",
        avg_rainfall: 1100,
        soil_type: "Mountain Soil",
        climate_zone: "Temperate / Alpine",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.8, 33.2], [76.2, 33.0], [76.6, 32.7], [77.0, 32.4],
            [77.4, 32.1], [77.8, 31.8], [78.2, 31.5], [78.5, 31.2],
            [78.7, 30.9], [79.0, 30.6], [79.2, 30.3], [79.3, 30.0],
            [79.2, 29.7], [78.9, 29.5], [78.5, 29.4], [78.0, 29.4],
            [77.5, 29.5], [77.0, 29.7], [76.5, 30.0], [76.1, 30.3],
            [75.8, 30.7], [75.6, 31.1], [75.5, 31.5], [75.5, 31.9],
            [75.6, 32.3], [75.7, 32.7], [75.8, 33.0], [75.8, 33.2]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Uttarakhand",
        avg_rainfall: 1500,
        soil_type: "Mountain / Alluvial",
        climate_zone: "Temperate / Subtropical",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.6, 31.5], [78.0, 31.3], [78.4, 31.0], [78.8, 30.7],
            [79.2, 30.4], [79.6, 30.1], [80.0, 29.8], [80.3, 29.5],
            [80.5, 29.2], [80.6, 28.8], [80.5, 28.5], [80.3, 28.2],
            [79.9, 28.0], [79.5, 27.9], [79.0, 27.9], [78.5, 28.0],
            [78.0, 28.2], [77.6, 28.5], [77.3, 28.8], [77.2, 29.2],
            [77.2, 29.6], [77.3, 30.0], [77.5, 30.4], [77.6, 30.8],
            [77.6, 31.2], [77.6, 31.5]
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Assam",
        avg_rainfall: 2800,
        soil_type: "Alluvial / Red Laterite",
        climate_zone: "Subtropical Monsoon",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.7, 27.5], [90.2, 27.3], [90.7, 27.0], [91.2, 26.7],
            [91.7, 26.4], [92.2, 26.1], [92.7, 25.8], [93.2, 25.5],
            [93.7, 25.2], [94.2, 24.9], [94.7, 24.6], [95.2, 24.4],
            [95.7, 24.2], [96.0, 24.0], [96.0, 23.7], [95.8, 23.4],
            [95.5, 23.2], [95.0, 23.1], [94.5, 23.1], [94.0, 23.2],
            [93.5, 23.4], [93.0, 23.7], [92.5, 24.0], [92.0, 24.3],
            [91.5, 24.7], [91.0, 25.1], [90.5, 25.5], [90.0, 25.9],
            [89.7, 26.3], [89.5, 26.7], [89.5, 27.1], [89.7, 27.5]
          ],
        ],
      },
    },
  ],
};

export const MAHARASHTRA_DISTRICTS_GEOJSON: FeatureCollection<Polygon, DistrictProps> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Ahmednagar",
        avg_rainfall: 580,
        rainfall_range: "550–600 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 62,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.9, 19.8],
            [75.8, 19.8],
            [75.8, 18.5],
            [73.9, 18.5],
            [73.9, 19.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Pune",
        avg_rainfall: 720,
        rainfall_range: "650–750 mm",
        soil_type: "Red Loam / Laterite edges",
        fertility_index: "High",
        climate_risk: "Moderate",
        vegetation_score: 74,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.2, 19.0],
            [74.7, 19.0],
            [74.7, 17.9],
            [73.2, 17.9],
            [73.2, 19.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Nashik",
        avg_rainfall: 820,
        rainfall_range: "750–900 mm",
        soil_type: "Black Soil / Loam",
        fertility_index: "High",
        climate_risk: "Low",
        vegetation_score: 81,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.4, 20.8],
            [75.2, 20.8],
            [75.2, 19.6],
            [73.4, 19.6],
            [73.4, 20.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Nagpur",
        avg_rainfall: 1050,
        rainfall_range: "950–1100 mm",
        soil_type: "Red & Yellow Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 70,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [78.6, 21.6],
            [80.4, 21.6],
            [80.4, 20.4],
            [78.6, 20.4],
            [78.6, 21.6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Solapur",
        avg_rainfall: 520,
        rainfall_range: "450–550 mm",
        soil_type: "Black Cotton",
        fertility_index: "Low",
        climate_risk: "High",
        vegetation_score: 48,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.9, 18.0],
            [76.6, 18.0],
            [76.6, 16.9],
            [74.9, 16.9],
            [74.9, 18.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Thane",
        avg_rainfall: 2400,
        rainfall_range: "2200–2600 mm",
        soil_type: "Laterite / Red Soil",
        fertility_index: "High",
        climate_risk: "Low",
        vegetation_score: 88,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.8, 20.2],
            [73.5, 20.2],
            [73.5, 18.9],
            [72.8, 18.9],
            [72.8, 20.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Mumbai",
        avg_rainfall: 2200,
        rainfall_range: "2000–2400 mm",
        soil_type: "Coastal Alluvial",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 65,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.75, 19.3],
            [73.1, 19.3],
            [73.1, 18.85],
            [72.75, 18.85],
            [72.75, 19.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Raigad",
        avg_rainfall: 3000,
        rainfall_range: "2500–3500 mm",
        soil_type: "Laterite / Coastal",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 76,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.85, 18.85],
            [73.5, 18.85],
            [73.5, 17.8],
            [72.85, 17.8],
            [72.85, 18.85],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Satara",
        avg_rainfall: 1200,
        rainfall_range: "900–1500 mm",
        soil_type: "Red / Laterite",
        fertility_index: "High",
        climate_risk: "Low",
        vegetation_score: 85,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.5, 18.2],
            [74.6, 18.2],
            [74.6, 17.0],
            [73.5, 17.0],
            [73.5, 18.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Kolhapur",
        avg_rainfall: 1800,
        rainfall_range: "1500–2100 mm",
        soil_type: "Red / Black Soil",
        fertility_index: "High",
        climate_risk: "Low",
        vegetation_score: 82,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.6, 17.0],
            [74.6, 17.0],
            [74.6, 15.9],
            [73.6, 15.9],
            [73.6, 17.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Sangli",
        avg_rainfall: 650,
        rainfall_range: "550–750 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 68,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.2, 17.3],
            [75.2, 17.3],
            [75.2, 16.4],
            [74.2, 16.4],
            [74.2, 17.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Aurangabad",
        avg_rainfall: 750,
        rainfall_range: "650–850 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 66,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.0, 20.3],
            [76.0, 20.3],
            [76.0, 19.3],
            [75.0, 19.3],
            [75.0, 20.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Jalgaon",
        avg_rainfall: 680,
        rainfall_range: "600–760 mm",
        soil_type: "Black Cotton",
        fertility_index: "High",
        climate_risk: "Moderate",
        vegetation_score: 72,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.2, 21.2],
            [76.4, 21.2],
            [76.4, 20.3],
            [75.2, 20.3],
            [75.2, 21.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Amravati",
        avg_rainfall: 920,
        rainfall_range: "850–1000 mm",
        soil_type: "Black / Red Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 69,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.8, 21.3],
            [78.3, 21.3],
            [78.3, 20.4],
            [76.8, 20.4],
            [76.8, 21.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Akola",
        avg_rainfall: 780,
        rainfall_range: "700–860 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 64,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.4, 21.2],
            [77.6, 21.2],
            [77.6, 20.2],
            [76.4, 20.2],
            [76.4, 21.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Chandrapur",
        avg_rainfall: 1250,
        rainfall_range: "1100–1400 mm",
        soil_type: "Red & Yellow",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 73,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.2, 20.4],
            [80.4, 20.4],
            [80.4, 19.0],
            [79.2, 19.0],
            [79.2, 20.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Beed",
        avg_rainfall: 640,
        rainfall_range: "580–700 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 60,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.5, 19.3],
            [76.4, 19.3],
            [76.4, 18.5],
            [75.5, 18.5],
            [75.5, 19.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Latur",
        avg_rainfall: 690,
        rainfall_range: "620–760 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 63,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.4, 18.6],
            [77.5, 18.6],
            [77.5, 17.8],
            [76.4, 17.8],
            [76.4, 18.6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Osmanabad",
        avg_rainfall: 710,
        rainfall_range: "640–780 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 62,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.0, 18.5],
            [76.8, 18.5],
            [76.8, 17.6],
            [76.0, 17.6],
            [76.0, 18.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Nanded",
        avg_rainfall: 950,
        rainfall_range: "850–1050 mm",
        soil_type: "Black / Red Soil",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 71,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.2, 19.8],
            [78.5, 19.8],
            [78.5, 18.4],
            [77.2, 18.4],
            [77.2, 19.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Parbhani",
        avg_rainfall: 880,
        rainfall_range: "800–960 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 68,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.4, 19.5],
            [77.2, 19.5],
            [77.2, 18.5],
            [76.4, 18.5],
            [76.4, 19.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Jalna",
        avg_rainfall: 770,
        rainfall_range: "700–840 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 65,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [75.5, 20.0],
            [76.4, 20.0],
            [76.4, 19.2],
            [75.5, 19.2],
            [75.5, 20.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Dhule",
        avg_rainfall: 620,
        rainfall_range: "560–680 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 64,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.1, 21.4],
            [75.2, 21.4],
            [75.2, 20.5],
            [74.1, 20.5],
            [74.1, 21.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Nandurbar",
        avg_rainfall: 850,
        rainfall_range: "750–950 mm",
        soil_type: "Black / Red Soil",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 70,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.6, 21.8],
            [74.6, 21.8],
            [74.6, 20.7],
            [73.6, 20.7],
            [73.6, 21.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Wardha",
        avg_rainfall: 1080,
        rainfall_range: "980–1180 mm",
        soil_type: "Black / Red Soil",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 72,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [78.3, 21.0],
            [79.2, 21.0],
            [79.2, 20.1],
            [78.3, 20.1],
            [78.3, 21.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Yavatmal",
        avg_rainfall: 1020,
        rainfall_range: "920–1120 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 70,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.8, 20.6],
            [78.8, 20.6],
            [78.8, 19.5],
            [77.8, 19.5],
            [77.8, 20.6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Buldhana",
        avg_rainfall: 760,
        rainfall_range: "680–840 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Moderate",
        vegetation_score: 66,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.0, 21.0],
            [77.0, 21.0],
            [77.0, 20.0],
            [76.0, 20.0],
            [76.0, 21.0],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Washim",
        avg_rainfall: 850,
        rainfall_range: "770–930 mm",
        soil_type: "Black Cotton",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 68,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.0, 20.5],
            [77.8, 20.5],
            [77.8, 19.7],
            [77.0, 19.7],
            [77.0, 20.5],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Hingoli",
        avg_rainfall: 920,
        rainfall_range: "830–1010 mm",
        soil_type: "Black Soil",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 69,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.0, 19.7],
            [77.6, 19.7],
            [77.6, 19.0],
            [77.0, 19.0],
            [77.0, 19.7],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Gondia",
        avg_rainfall: 1400,
        rainfall_range: "1200–1600 mm",
        soil_type: "Red & Yellow",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 75,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.8, 21.6],
            [80.6, 21.6],
            [80.6, 20.7],
            [79.8, 20.7],
            [79.8, 21.6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Bhandara",
        avg_rainfall: 1320,
        rainfall_range: "1150–1490 mm",
        soil_type: "Red Soil",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 74,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.5, 21.4],
            [80.2, 21.4],
            [80.2, 20.5],
            [79.5, 20.5],
            [79.5, 21.4],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Gadchiroli",
        avg_rainfall: 1650,
        rainfall_range: "1400–1900 mm",
        soil_type: "Red Laterite",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 78,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.8, 20.2],
            [80.6, 20.2],
            [80.6, 18.8],
            [79.8, 18.8],
            [79.8, 20.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Ratnagiri",
        avg_rainfall: 3500,
        rainfall_range: "3000–4000 mm",
        soil_type: "Laterite Coastal",
        fertility_index: "Medium",
        climate_risk: "Low",
        vegetation_score: 80,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [72.9, 17.8],
            [73.5, 17.8],
            [73.5, 16.5],
            [72.9, 16.5],
            [72.9, 17.8],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Sindhudurg",
        avg_rainfall: 3800,
        rainfall_range: "3200–4400 mm",
        soil_type: "Laterite / Coastal",
        fertility_index: "High",
        climate_risk: "Low",
        vegetation_score: 86,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [73.3, 16.5],
            [73.9, 16.5],
            [73.9, 15.6],
            [73.3, 15.6],
            [73.3, 16.5],
          ],
        ],
      },
    },
  ],
};

