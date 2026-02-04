"use client";

import type { LifeStage } from '../utils/lifecycleUtils';
import { getHealthColor } from '../utils/lifecycleUtils';

interface MetricsPanelProps {
  stage: LifeStage;
  carbonSequestration: number;
  healthScore: number;
  healthStatusLabel: string;
  orgCarbon: number;
  nitrogen: number;
  city: string;
}

export function MetricsPanel({
  stage,
  carbonSequestration,
  healthScore,
  healthStatusLabel,
  orgCarbon,
  nitrogen,
  city,
}: MetricsPanelProps) {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
        <div className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Lifecycle Stage
        </div>
        <div className="mt-2 text-xl font-bold text-emerald-400">
          {stage.name}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {Math.round(stage.start * 100)}–{Math.round(stage.end * 100)}%
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
        <div className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Carbon (kg)
        </div>
        <div className="mt-2 text-xl font-bold text-blue-400">
          {carbonSequestration.toFixed(1)}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Sequestered
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
        <div className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Health
        </div>
        <div className={`mt-2 text-xl font-bold ${getHealthColor(healthScore)}`}>
          {healthStatusLabel}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {(healthScore * 100).toFixed(0)}%
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
        <div className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Soil Carbon
        </div>
        <div className="mt-2 text-xl font-bold text-amber-400">
          {orgCarbon.toFixed(2)}%
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Organic carbon
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur">
        <div className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Nitrogen
        </div>
        <div className="mt-2 text-xl font-bold text-green-400">
          {nitrogen.toFixed(3)}%
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Available N
        </div>
      </div>
    </div>
  );
}
