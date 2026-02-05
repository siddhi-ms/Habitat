"use client";

import { useEffect, useState } from "react";
import { TreeLifecycle } from "../components/TreeLifecycle";
import { TimelineSlider } from "../components/TimelineSlider";
import { MetricsPanel } from "../components/MetricsPanel";
import { parseTreesCSV, type TreeSpecies } from "../data/parseTrees";
import { parseSoilWeatherCSV, aggregateSoilWeatherByCity, type SoilWeatherSummary } from "../data/parseSoilWeather";
import {
  getMaturityYears,
  getCurrentStage,
  calculateCarbonSequestration,
  getHealthStatusLabel,
} from "../utils/lifecycleUtils";

// CRITICAL: This must be a default export
export default function SimulationPage() {
  const [trees, setTrees] = useState<TreeSpecies[]>([]);
  const [soilData, setSoilData] = useState<Map<string, SoilWeatherSummary>>(new Map());
  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [simulationYears, setSimulationYears] = useState<number>(20);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const treeData = await parseTreesCSV();
        setTrees(treeData);
        if (treeData.length > 0) setSelectedSpecies(treeData[0]);

        const weatherData = await parseSoilWeatherCSV();
        const aggregated = aggregateSoilWeatherByCity(weatherData);
        setSoilData(aggregated);

        const cityList = Array.from(aggregated.keys()).sort();
        setCities(cityList);
        if (cityList.length > 0) setSelectedCity(cityList[0]);

        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentSoilWeather = selectedCity ? soilData.get(selectedCity) : null;
  const maturityYears = selectedSpecies ? getMaturityYears(selectedSpecies, simulationYears) : simulationYears;
  const currentStage = selectedSpecies && currentSoilWeather ? getCurrentStage(currentYear, maturityYears) : null;
  const carbonSeq = selectedSpecies && currentSoilWeather 
    ? calculateCarbonSequestration(selectedSpecies, currentSoilWeather, currentYear, maturityYears) 
    : 0;
  const healthStatusLabel = selectedSpecies && currentSoilWeather 
    ? getHealthStatusLabel(currentYear / maturityYears) 
    : "Unknown";

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-emerald-400 font-mono tracking-widest">LOADING ECOSYSTEM_DATA...</div>
      </div>
    );
  }

  if (!selectedSpecies || !currentSoilWeather) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-400">
        DATA_CONNECTION_ERROR
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/20 text-zinc-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">
              Habitat <span className="text-emerald-500">v2.0</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Advanced Species Growth Simulation</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Active Species</p>
              <p className="font-medium text-emerald-400">{selectedSpecies.species_name}</p>
            </div>
            <div className="text-right border-l border-white/10 pl-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Location</p>
              <p className="font-medium text-zinc-200">{selectedCity}</p>
            </div>
          </div>
        </header>

        {/* Top Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">Species</label>
            <select
              value={selectedSpecies.species_name}
              onChange={(e) => {
                const s = trees.find((t) => t.species_name === e.target.value);
                if (s) { setSelectedSpecies(s); setCurrentYear(0); }
              }}
              className="w-full bg-zinc-900 border-none rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500"
            >
              {trees.map((t) => <option key={t.species_name} value={t.species_name}>{t.species_name}</option>)}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">Environment</label>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setCurrentYear(0); }}
              className="w-full bg-zinc-900 border-none rounded-lg text-sm p-2 focus:ring-2 focus:ring-emerald-500"
            >
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">Max Life: {simulationYears}y</label>
            <input
              type="range" min="5" max="100" step="5"
              value={simulationYears}
              onChange={(e) => { setSimulationYears(parseInt(e.target.value)); setCurrentYear(0); }}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Tree Visual Core */}
        <TreeLifecycle
          species={selectedSpecies}
          soilWeather={currentSoilWeather}
          currentYear={currentYear}
          maturityYears={maturityYears}
        />

        {/* Timeline Slider Section */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
          <TimelineSlider
            currentYear={currentYear}
            maxYears={maturityYears}
            onChange={setCurrentYear}
          />
        </div>

        {/* Metrics Section */}
        {currentStage && (
          <MetricsPanel
            stage={currentStage}
            carbonSequestration={carbonSeq}
            healthScore={1}
            healthStatusLabel={healthStatusLabel}
            orgCarbon={currentSoilWeather.avgOrgCarbon}
            nitrogen={currentSoilWeather.avgNitrogen}
            city={selectedCity}
          />
        )}
      </div>
    </div>
  );
}