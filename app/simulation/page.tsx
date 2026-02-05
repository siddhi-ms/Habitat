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
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-900 via-emerald-950 to-zinc-900 text-zinc-50 p-8">
      <div className="h-full overflow-y-auto pb-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-4 backdrop-blur">
          <div className="text-xs font-medium tracking-wide text-emerald-400 uppercase">
            HABITAT • ADVANCED SIMULATION
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

        {/* Timeline Slider - FIXED */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur">
        <TimelineSlider
          currentYear={currentYear}
          maxYears={simulationYears} // <--- CHANGE THIS from 'maturityYears' to 'simulationYears'
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

        {/* Environmental Data Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
            <div className="text-xs font-semibold text-zinc-400 uppercase mb-2">Weather Conditions</div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-500">Rainfall (90d):</span>
                <span className="ml-2 font-semibold text-zinc-200">{currentSoilWeather.avgRainfall90d.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-zinc-500">Avg Temp:</span>
                <span className="ml-2 font-semibold text-zinc-200">{currentSoilWeather.avgTemp.toFixed(1)}°C</span>
              </div>
              <div>
                <span className="text-zinc-500">Humidity:</span>
                <span className="ml-2 font-semibold text-zinc-200">{currentSoilWeather.avgHumidity.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
            <div className="text-xs font-semibold text-zinc-400 uppercase mb-2">Soil Properties</div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-500">pH:</span>
                <span className="ml-2 font-semibold text-zinc-200">{currentSoilWeather.avgPH.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Org. Carbon:</span>
                <span className="ml-2 font-semibold text-zinc-200">{currentSoilWeather.avgOrgCarbon.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Nitrogen:</span>
                <span className="ml-2 font-semibold text-zinc-200">{currentSoilWeather.avgNitrogen.toFixed(3)}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
            <div className="text-xs font-semibold text-zinc-400 uppercase mb-2">Species Traits</div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-500">Growth Rate:</span>
                <span className="ml-2 font-semibold text-zinc-200">
                  {selectedSpecies.growth_fast ? "⚡ Fast" : selectedSpecies.growth_medium ? "🌱 Medium" : "🐌 Slow"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Root Depth:</span>
                <span className="ml-2 font-semibold text-zinc-200">
                  {selectedSpecies.root_deep ? "Deep" : selectedSpecies.root_medium ? "Medium" : "Shallow"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Drought Tolerance:</span>
                <span className="ml-2 font-semibold text-zinc-200">{(selectedSpecies.drought_tol_norm * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}