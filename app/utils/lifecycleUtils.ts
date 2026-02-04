import type { TreeSpecies } from '../data/parseTrees';
import type { SoilWeatherSummary } from '../data/parseSoilWeather';

export interface LifeStage {
  name: string;
  start: number;
  end: number;
}

export const LIFE_STAGES: LifeStage[] = [
  { name: "Sapling", start: 0.0, end: 0.15 },
  { name: "Establishment", start: 0.15, end: 0.35 },
  { name: "Vegetative Growth", start: 0.35, end: 0.6 },
  { name: "Canopy Expansion", start: 0.6, end: 0.85 },
  { name: "Mature", start: 0.85, end: 1.0 }
];

export function getMaturityYears(species: TreeSpecies, selectedYears: number): number {
  if (species.growth_fast === 1) return selectedYears * 0.5;
  if (species.growth_medium === 1) return selectedYears * 0.75;
  return selectedYears; // slow growth
}

export function calculateHealthScore(
  species: TreeSpecies,
  soilWeather: SoilWeatherSummary
): number {
  // Normalize soil/weather values to 0-1 range
  const rainfallFactor = Math.min(soilWeather.avgRainfall90d / 200, 1); // 200mm threshold
  const droughtResistance = species.drought_tol_norm;
  const droughtCondition = 1 - (soilWeather.avgDroughtIndex / 100); // Lower drought index = better
  const carbonFactor = Math.min(soilWeather.avgOrgCarbon / 3, 1); // 3% is excellent
  const nitrogenFactor = Math.min(soilWeather.avgNitrogen / 0.3, 1); // 0.3% is good
  const tempSafety = Math.max(0, 1 - Math.abs(soilWeather.avgTemp - 25) / 20); // Optimal around 25°C

  // Weighted calculation
  const score =
    rainfallFactor * 0.25 +
    carbonFactor * 0.2 +
    nitrogenFactor * 0.2 +
    droughtResistance * droughtCondition * 0.2 +
    tempSafety * 0.15;

  return Math.max(0, Math.min(1, score));
}

export function getCurrentStage(
  yearProgress: number,
  maturityYears: number
): LifeStage {
  const progress = yearProgress / maturityYears;

  for (const stage of LIFE_STAGES) {
    if (progress >= stage.start && progress <= stage.end) {
      return stage;
    }
  }

  return LIFE_STAGES[LIFE_STAGES.length - 1];
}

export function calculateCarbonSequestration(
  species: TreeSpecies,
  soilWeather: SoilWeatherSummary,
  yearProgress: number,
  maturityYears: number
): number {
  const progress = yearProgress / maturityYears;
  const healthScore = calculateHealthScore(species, soilWeather);

  // Carbon sequestration increases with maturity and health
  return species.carbon_factor_norm * progress * healthScore * 150;
}

export function getHealthStatusLabel(healthScore: number): string {
  if (healthScore > 0.8) return "Excellent";
  if (healthScore > 0.6) return "Good";
  if (healthScore > 0.4) return "Fair";
  if (healthScore > 0.2) return "Poor";
  return "Critical";
}

export function getHealthColor(healthScore: number): string {
  if (healthScore > 0.8) return "text-green-400";
  if (healthScore > 0.6) return "text-emerald-400";
  if (healthScore > 0.4) return "text-yellow-400";
  if (healthScore > 0.2) return "text-orange-400";
  return "text-red-400";
}
