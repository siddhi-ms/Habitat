export interface TreeSpecies {
  species_name: string;
  min_rainfall_norm: number;
  max_temp_norm: number;
  ph_min_norm: number;
  ph_max_norm: number;
  drought_tol_norm: number;
  carbon_factor_norm: number;
  soil_sandy: number;
  soil_loamy: number;
  soil_clayey: number;
  growth_slow: number;
  growth_medium: number;
  growth_fast: number;
  root_shallow: number;
  root_medium: number;
  root_deep: number;
  shade_low: number;
  shade_medium: number;
  shade_high: number;
}

export async function parseTreesCSV(): Promise<TreeSpecies[]> {
  const response = await fetch('/data/trees.csv');
  const text = await response.text();
  
  const lines = text.trim().split('\n');
  const trees: TreeSpecies[] = [];
  
  // Skip header lines (first 5 lines are headers)
  let i = 5;
  
  while (i < lines.length) {
    const nameLine = lines[i].trim();
    if (!nameLine || nameLine.startsWith('species_name')) {
      i++;
      continue;
    }
    
    const parts = nameLine.split(',');
    const species_name = parts[0];
    
    // Parse numeric values from the name line
    const min_rainfall_norm = parseFloat(parts[1]) || 0;
    const max_temp_norm = parseFloat(parts[2]) || 0;
    const ph_min_norm = parseFloat(parts[3]) || 0;
    const ph_max_norm = parseFloat(parts[4]) || 0;
    const drought_tol_norm = parseFloat(parts[5]) || 0;
    const carbon_factor_norm = parseFloat(parts[6]) || 0;
    
    // Parse one-hot encoded fields from next lines
    const soilLine = lines[i + 1]?.trim().split(',') || [];
    const growthLine = lines[i + 2]?.trim().split(',') || [];
    const rootLine = lines[i + 3]?.trim().split(',') || [];
    const shadeLine = lines[i + 4]?.trim().split(',') || [];
    
    trees.push({
      species_name,
      min_rainfall_norm,
      max_temp_norm,
      ph_min_norm,
      ph_max_norm,
      drought_tol_norm,
      carbon_factor_norm,
      soil_sandy: parseInt(soilLine[0]) || 0,
      soil_loamy: parseInt(soilLine[1]) || 0,
      soil_clayey: parseInt(soilLine[2]) || 0,
      growth_slow: parseInt(growthLine[0]) || 0,
      growth_medium: parseInt(growthLine[1]) || 0,
      growth_fast: parseInt(growthLine[2]) || 0,
      root_shallow: parseInt(rootLine[0]) || 0,
      root_medium: parseInt(rootLine[1]) || 0,
      root_deep: parseInt(rootLine[2]) || 0,
      shade_low: parseInt(shadeLine[0]) || 0,
      shade_medium: parseInt(shadeLine[1]) || 0,
      shade_high: parseInt(shadeLine[2]) || 0,
    });
    
    // Skip to next species (5 lines per species + 1 blank line)
    i += 6;
  }
  
  return trees;
}
