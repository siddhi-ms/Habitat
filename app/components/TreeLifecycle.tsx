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

export const TreeLifecycle = ({
  species,
  soilWeather,
  currentYear,
  maturityYears,
}: TreeLifecycleProps) => {
  const progress = Math.min(currentYear / maturityYears, 1);
  
  // 1. Unified Growth Logic (Prevents the plant from "shrinking" or vanishing)
  // We calculate a base size that never decreases, even during stage swaps.
  const growthScale = 0.25 + progress * 0.9;
  
  // 2. Health & Season Logic from CSV
  const isHealthy = soilWeather.avgNitrogen > 0.1 && soilWeather.avgPH > 6;
  const healthFilter = isHealthy ? "saturate(1.2) brightness(1.1)" : "saturate(0.7) sepia(0.2)";

  const getStage = () => {
    if (progress < 0.15) return { id: "seedling", src: "https://img.icons8.com/color/512/sprout.png" };
    if (progress < 0.45) return { id: "sapling", src: "https://img.icons8.com/color/512/deciduous-tree.png" };
    if (progress < 0.75) return { id: "mature", src: "https://img.icons8.com/color/512/oak-tree.png" };
    return { id: "ancient", src: "https://img.icons8.com/color/512/forest.png" };
  };

  const stage = getStage();

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

      {/* 4. The Tree Container (Continuous Motion) */}
      <motion.div
        style={{ filter: healthFilter }}
        animate={{ 
          scale: growthScale,
          rotate: [ -0.5, 0.5, -0.5 ],
          y: -10 // Keep it slightly above the ground line
        }}
        transition={{ 
          scale: { type: "spring", stiffness: 20, damping: 15 },
          rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative z-10 origin-bottom flex items-center justify-center mb-16"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={stage.id}
            src={stage.src}
            alt={stage.id}
            // Use absolute positioning to prevent the "jump" during transitions
            className="h-80 w-auto object-contain drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]"
            initial={{ opacity: 0, filter: "blur(20px)", scale: 0.8 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.2, position: "absolute" }}
            transition={{ 
              opacity: { duration: 1.2 },
              filter: { duration: 1.2 },
              scale: { duration: 1.5 } 
            }}
          />
        </AnimatePresence>
      </motion.div>

      {/* 5. Realistic Ground & Soil Layer */}
      <div className="absolute bottom-0 w-full h-24 z-20">
        {/* Shadow under tree */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/40 blur-xl rounded-full" />
        
        {/* Soil Gradient */}
        <div className="w-full h-full bg-gradient-to-t from-[#1a1c1e] via-[#242729] to-transparent border-t border-white/5 backdrop-blur-md px-8 py-6">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Soil Condition</span>
              <span className="text-xs font-semibold text-emerald-400">
                {soilWeather.avgPH.toFixed(1)} pH • {soilWeather.avgNitrogen.toFixed(3)}% N
              </span>
            </div>
            
            {/* Growth Percentage Indicator */}
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Maturity</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <span className="text-xs font-mono text-zinc-300">{(progress * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Season Overlay (Based on Year progress) */}
      <motion.div 
        animate={{ opacity: progress > 0.9 ? 1 : 0 }}
        className="absolute inset-0 pointer-events-none bg-orange-500/5 mix-blend-overlay"
      />
    </div>
  );
};