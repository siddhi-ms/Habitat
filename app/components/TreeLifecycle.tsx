"use client";

import { useMemo } from 'react';
import type { TreeSpecies } from '../data/parseTrees';
import type { SoilWeatherSummary } from '../data/parseSoilWeather';
import { calculateHealthScore } from '../utils/lifecycleUtils';
import { ProceduralTree } from './ProceduralTree';

interface TreeLifecycleProps {
  species: TreeSpecies;
  soilWeather: SoilWeatherSummary;
  currentYear: number;
  maturityYears: number;
}

export function TreeLifecycle({
  species,
  soilWeather,
  currentYear,
  maturityYears,
}: TreeLifecycleProps) {
  const healthScore = useMemo(
    () => calculateHealthScore(species, soilWeather),
    [species, soilWeather]
  );

  return (
    <div className="w-full h-[500px] rounded-2xl border border-white/10 bg-gradient-to-b from-sky-900/20 to-emerald-950/30 overflow-hidden relative">
      <ProceduralTree
        speciesName={species.species_name}
        yearProgress={currentYear}
        maturityYears={maturityYears}
        healthScore={healthScore}
        species={species}
      />

      {/* Location & conditions label */}
      <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur">
        <div className="text-xs font-semibold text-emerald-400">
          📍 {soilWeather.city}
        </div>
      </div>

      {/* Health indicator */}
      <div className="absolute top-4 right-4 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur">
        <div className="text-xs font-semibold text-zinc-300">
          Health: {(healthScore * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
