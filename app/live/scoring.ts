import type { ClimateRisk, DistrictProps, FertilityIndex } from "./geo";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fertilityWeight(f: FertilityIndex) {
  switch (f) {
    case "High":
      return 1.0;
    case "Medium":
      return 0.72;
    case "Low":
      return 0.48;
  }
}

function climatePenalty(r: ClimateRisk) {
  switch (r) {
    case "Low":
      return 0.0;
    case "Moderate":
      return 10.0;
    case "High":
      return 22.0;
  }
}

// Rainfall "sweet spot" curve (mm/year):
// - too low: water stress
// - too high: erosion/waterlogging risk + establishment difficulty
function rainfallSubScore(mm: number) {
  if (mm <= 450) return 25;
  if (mm <= 650) return 45;
  if (mm <= 900) return 70;
  if (mm <= 1200) return 82;
  if (mm <= 1600) return 70;
  return 55;
}

function soilBonus(soilType: string) {
  const s = soilType.toLowerCase();
  if (s.includes("loam") || s.includes("alluvial")) return 6;
  if (s.includes("laterite")) return 3;
  if (s.includes("black")) return 2; // strong nutrient holding, but can be water-stress prone
  if (s.includes("sandy")) return -2;
  return 0;
}

export type SuitabilityInsight = {
  score: number; // 0..100
  summaryBullets: string[];
  recommendedStrategy: string[];
  rationale: Array<{ label: string; value: string }>;
};

export function deriveSuitability(props: DistrictProps): SuitabilityInsight {
  const rain = rainfallSubScore(props.avg_rainfall);
  const fert = 100 * fertilityWeight(props.fertility_index);
  const veg = clamp(props.vegetation_score, 0, 100);

  // Weighted blend, then subtract climate penalty; clamp for demo.
  const blended =
    0.44 * rain + 0.36 * fert + 0.20 * veg + soilBonus(props.soil_type);
  const score = clamp(Math.round(blended - climatePenalty(props.climate_risk)), 0, 100);

  const strategy: string[] = [];
  if (props.climate_risk === "High" || props.avg_rainfall < 650) {
    strategy.push("Water conservation and drought mitigation focus");
    strategy.push("Land preparation with moisture retention techniques");
  } else {
    strategy.push("Suitable for diverse reforestation strategies");
    strategy.push("Natural regeneration potential");
  }
  if (props.fertility_index === "Low") {
    strategy.push("Soil restoration recommended before planting");
  } else if (props.fertility_index === "Medium") {
    strategy.push("Consider soil amendments in critical zones");
  } else {
    strategy.push("Strong soil foundation for establishment");
  }

  const summary = [
    `Rainfall: ${props.rainfall_range}`,
    `Soil: ${props.soil_type} • Fertility: ${props.fertility_index}`,
    `Climate risk: ${props.climate_risk}`,
  ];

  const rationale = [
    { label: "Rainfall sub-score", value: `${rain}/100` },
    { label: "Fertility factor", value: `${Math.round(fert)}/100` },
    { label: "Vegetation baseline", value: `${veg}/100` },
    { label: "Climate penalty", value: `-${climatePenalty(props.climate_risk)}` },
  ];

  return { score, summaryBullets: summary, recommendedStrategy: strategy, rationale };
}

