"use client";

import type { LandPatch } from "./sindhudurgData";

export function PatchInfoPanel({
  patch,
  onClose,
}: {
  patch: LandPatch | null;
  onClose: () => void;
}) {
  if (!patch) return null;

  // Validate patch.center to ensure it's a valid array
  const isValidCenter = Array.isArray(patch.center) && 
    patch.center.length === 2 && 
    typeof patch.center[0] === 'number' && 
    typeof patch.center[1] === 'number';

  if (!isValidCenter) {
    console.error('Invalid patch.center:', patch);
    return null;
  }

  const getRiskLabel = (score: number) => {
    if (score < 25) return "Low";
    if (score < 50) return "Moderate";
    if (score < 70) return "Elevated";
    return "High";
  };

  const getSuitabilityLabel = (score: number) => {
    if (score < 40) return "Poor";
    if (score < 60) return "Fair";
    if (score < 75) return "Good";
    return "Excellent";
  };

  const getScoreColor = (score: number, inverted = false) => {
    const normalizedScore = inverted ? 100 - score : score;
    if (normalizedScore < 40) return "text-red-400";
    if (normalizedScore < 60) return "text-yellow-400";
    if (normalizedScore < 75) return "text-emerald-400";
    return "text-green-400";
  };

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30 w-full max-w-md rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium tracking-wide text-emerald-400">
              LAND PATCH
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {patch.id}
            </div>
            <div className="mt-0.5 text-xs text-white/60">
              {patch.center[1].toFixed(3)}°N, {patch.center[0].toFixed(3)}°E
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
        {/* Overall Suitability */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-xs font-medium tracking-wide text-white/70">
            OVERALL SUITABILITY
          </div>
          <div className="flex items-end gap-3">
            <div className={`text-3xl font-bold ${getScoreColor(patch.suitability_score)}`}>
              {patch.suitability_score}
            </div>
            <div className="mb-1 text-sm font-medium text-white/80">
              {getSuitabilityLabel(patch.suitability_score)}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${patch.suitability_score}%` }}
            />
          </div>
        </div>

        {/* Environmental Metrics */}
        <div className="space-y-4">
          {/* Rainfall */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-white/70">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              RAINFALL
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-xs text-white/60">30 days</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {patch.rainfall_30d} <span className="text-sm text-white/70">mm</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-xs text-white/60">90 days</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {patch.rainfall_90d} <span className="text-sm text-white/70">mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-white/70">
              <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              TEMPERATURE & STRESS
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-xs text-white/60">Avg. Temp</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {patch.avg_temp} <span className="text-sm text-white/70">°C</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-xs text-white/60">Heat Stress</div>
                <div className={`mt-1 text-lg font-semibold ${getScoreColor(patch.heat_stress, true)}`}>
                  {patch.heat_stress}%
                </div>
              </div>
            </div>
          </div>

          {/* Soil Properties */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-white/70">
              <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M3 7a2 2 0 012-2h14a2 2 0 012 2M3 7h18M5 10v10h14V10M9 21v-8a2 2 0 012-2h2a2 2 0 012 2v8" />
              </svg>
              SOIL QUALITY
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="text-sm text-white/70">Carbon</span>
                <span className="font-semibold text-white">{patch.soil_carbon}%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="text-sm text-white/70">Nitrogen</span>
                <span className="font-semibold text-white">{patch.soil_nitrogen}%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="text-sm text-white/70">pH</span>
                <span className="font-semibold text-white">{patch.soil_ph}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <span className="text-sm text-white/70">Fertility Score</span>
                <span className={`font-semibold ${getScoreColor(patch.fertility_score)}`}>
                  {patch.fertility_score}/100
                </span>
              </div>
            </div>
          </div>

          {/* Climate Risk */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-white/70">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              CLIMATE RISK
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-xs text-white/60">Drought Index</div>
                <div className={`mt-1 text-lg font-semibold ${getScoreColor(patch.drought_index, true)}`}>
                  {patch.drought_index}%
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-xs text-white/60">Overall Risk</div>
                <div className={`mt-1 text-lg font-semibold ${getScoreColor(patch.climate_risk_score, true)}`}>
                  {getRiskLabel(patch.climate_risk_score)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="mb-2 text-xs font-medium tracking-wide text-emerald-400">
            ANALYSIS SUMMARY
          </div>
          <div className="space-y-1.5 text-sm text-white/80">
            {patch.suitability_score >= 75 && (
              <p>✓ Excellent conditions for reforestation planning</p>
            )}
            {patch.suitability_score >= 60 && patch.suitability_score < 75 && (
              <p>✓ Good conditions with minor considerations</p>
            )}
            {patch.suitability_score < 60 && (
              <p>⚠ Fair conditions - may require soil amendments</p>
            )}
            {patch.rainfall_90d > 1000 && <p>✓ High rainfall adequacy</p>}
            {patch.fertility_score > 70 && <p>✓ Strong soil fertility</p>}
            {patch.climate_risk_score < 30 && <p>✓ Low climate stress</p>}
            {patch.drought_index > 50 && <p>⚠ Elevated drought risk</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
