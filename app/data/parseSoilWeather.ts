export interface SoilWeatherRecord {
  city: string;
  lat: number;
  lon: number;
  date: string;
  rainfall_30d: number;
  rainfall_90d: number;
  temp_mean: number;
  temp_max: number;
  humidity_mean: number;
  drought_index: number;
  pH: number;
  Org_Carbon_pct: number;
  Nitrogen_pct: number;
  Texture_Code: string;
}

export interface SoilWeatherSummary {
  city: string;
  avgRainfall30d: number;
  avgRainfall90d: number;
  avgTemp: number;
  maxTemp: number;
  avgHumidity: number;
  avgDroughtIndex: number;
  avgPH: number;
  avgOrgCarbon: number;
  avgNitrogen: number;
  mostCommonTexture: string;
}

export async function parseSoilWeatherCSV(): Promise<SoilWeatherRecord[]> {
  const response = await fetch('/data/soil_weather.csv');
  const text = await response.text();
  
  const lines = text.trim().split('\n');
  const records: SoilWeatherRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 17) continue;
    
    records.push({
      city: parts[0].trim(),
      lat: parseFloat(parts[1]) || 0,
      lon: parseFloat(parts[2]) || 0,
      date: parts[3].trim(),
      rainfall_30d: parseFloat(parts[4]) || 0,
      rainfall_90d: parseFloat(parts[5]) || 0,
      temp_mean: parseFloat(parts[6]) || 0,
      temp_max: parseFloat(parts[7]) || 0,
      humidity_mean: parseFloat(parts[8]) || 0,
      drought_index: parseFloat(parts[9]) || 0,
      pH: parseFloat(parts[13]) || 6.5,
      Org_Carbon_pct: parseFloat(parts[14]) || 1.5,
      Nitrogen_pct: parseFloat(parts[15]) || 0.1,
      Texture_Code: parts[16]?.trim() || 'LoamyR',
    });
  }
  
  return records;
}

export function aggregateSoilWeatherByCity(
  records: SoilWeatherRecord[]
): Map<string, SoilWeatherSummary> {
  const byCity = new Map<string, SoilWeatherRecord[]>();
  
  // Group by city
  for (const record of records) {
    if (!byCity.has(record.city)) {
      byCity.set(record.city, []);
    }
    byCity.get(record.city)!.push(record);
  }
  
  // Aggregate
  const summaries = new Map<string, SoilWeatherSummary>();
  
  for (const [city, cityRecords] of byCity) {
    const count = cityRecords.length;
    
    summaries.set(city, {
      city,
      avgRainfall30d: cityRecords.reduce((sum, r) => sum + r.rainfall_30d, 0) / count,
      avgRainfall90d: cityRecords.reduce((sum, r) => sum + r.rainfall_90d, 0) / count,
      avgTemp: cityRecords.reduce((sum, r) => sum + r.temp_mean, 0) / count,
      maxTemp: Math.max(...cityRecords.map(r => r.temp_max)),
      avgHumidity: cityRecords.reduce((sum, r) => sum + r.humidity_mean, 0) / count,
      avgDroughtIndex: cityRecords.reduce((sum, r) => sum + r.drought_index, 0) / count,
      avgPH: cityRecords.reduce((sum, r) => sum + r.pH, 0) / count,
      avgOrgCarbon: cityRecords.reduce((sum, r) => sum + r.Org_Carbon_pct, 0) / count,
      avgNitrogen: cityRecords.reduce((sum, r) => sum + r.Nitrogen_pct, 0) / count,
      mostCommonTexture: getMostCommon(cityRecords.map(r => r.Texture_Code)),
    });
  }
  
  return summaries;
}

function getMostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'LoamyR';
}
