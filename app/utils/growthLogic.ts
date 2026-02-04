import type { TreeSpecies } from '../data/parseTrees';

export interface LifeStage {
  name: string;
  start: number;
  end: number;
}

export const LIFE_STAGES: LifeStage[] = [
  { name: "Sapling", start: 0, end: 0.15 },
  { name: "Establishment", start: 0.15, end: 0.35 },
  { name: "Vegetative", start: 0.35, end: 0.6 },
  { name: "Canopy", start: 0.6, end: 0.85 },
  { name: "Mature", start: 0.85, end: 1 }
];

export function getMaturityYears(species: TreeSpecies): number {
  if (species.growth_fast === 1) return 8;
  if (species.growth_medium === 1) return 12;
  return 18; // slow growth
}

export function calculateGrowthFactor(species: TreeSpecies): number {
  const factor =
    species.min_rainfall_norm * 0.3 +
    species.drought_tol_norm * 0.25 +
    species.carbon_factor_norm * 0.2 +
    species.root_deep * 0.15 +
    species.shade_high * 0.1;
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, factor));
}

export function getCurrentStage(yearProgress: number, maturityYears: number): LifeStage {
  const progress = yearProgress / maturityYears;
  
  for (const stage of LIFE_STAGES) {
    if (progress >= stage.start && progress <= stage.end) {
      return stage;
    }
  }
  
  return LIFE_STAGES[LIFE_STAGES.length - 1]; // Default to mature
}

export function calculateCarbonSequestration(
  species: TreeSpecies,
  yearProgress: number,
  maturityYears: number
): number {
  const progress = yearProgress / maturityYears;
  const growthFactor = calculateGrowthFactor(species);
  
  // Carbon sequestration increases with age and growth factor
  return species.carbon_factor_norm * progress * growthFactor * 100;
}

export function calculateHealthStatus(
  species: TreeSpecies,
  yearProgress: number
): string {
  const growthFactor = calculateGrowthFactor(species);
  
  if (growthFactor > 0.7) return "Excellent";
  if (growthFactor > 0.5) return "Good";
  if (growthFactor > 0.3) return "Fair";
  return "Poor";
}
