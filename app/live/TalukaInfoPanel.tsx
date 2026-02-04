"use client";

import { useEffect, useRef } from "react";
import type { Taluka } from "./sindhudurgTalukas";

export function TalukaInfoPanel({
  taluka,
  onClose,
}: {
  taluka: Taluka | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (taluka) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [taluka, onClose]);

  if (!taluka) return null;

  return (
    <div className="fixed right-4 top-24 z-30 w-full max-w-sm">
      <div
        ref={panelRef}
        className="rounded-xl border border-white/20 bg-black/50 p-5 backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-100">
              {taluka.name}
            </h3>
            <p className="mt-0.5 text-xs text-white/60">
              Taluka • Sindhudurg District
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
          >
            <svg
              className="h-4 w-4 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Climate Indicators */}
          <div className="rounded-lg bg-white/5 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Climate & Environment
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-white/70">90-Day Rainfall</span>
                <span className="text-sm font-medium text-white">
                  {taluka.rainfall_90d} mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Avg Temperature</span>
                <span className="text-sm font-medium text-white">
                  {taluka.avg_temp}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Drought Risk</span>
                <span className="text-sm font-medium text-white">
                  {taluka.drought_index}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Climate Risk Score</span>
                <span className="text-sm font-medium text-white">
                  {taluka.climate_risk_score}/100
                </span>
              </div>
            </div>
          </div>

          {/* Soil Properties */}
          <div className="rounded-lg bg-white/5 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Soil Properties
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Carbon Content</span>
                <span className="text-sm font-medium text-white">
                  {taluka.soil_carbon}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Nitrogen Content</span>
                <span className="text-sm font-medium text-white">
                  {taluka.soil_nitrogen}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Soil pH</span>
                <span className="text-sm font-medium text-white">
                  {taluka.soil_ph}
                </span>
              </div>
            </div>
          </div>

          {/* Productivity Metrics */}
          <div className="rounded-lg bg-white/5 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Land Suitability
            </h4>
            <div className="space-y-2">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-xs text-white/70">Fertility Score</span>
                  <span className="text-sm font-medium text-white">
                    {taluka.fertility_score}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
                    style={{
                      width: `${Math.min(100, taluka.fertility_score)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-xs text-white/70">Overall Suitability</span>
                  <span className="text-sm font-medium text-white">
                    {taluka.suitability_score}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400"
                    style={{
                      width: `${Math.min(100, taluka.suitability_score)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="text-xs leading-relaxed text-emerald-100">
              {taluka.suitability_score > 85
                ? `${taluka.name} is highly suitable for agricultural development with excellent soil fertility and stable climate conditions.`
                : taluka.suitability_score > 75
                  ? `${taluka.name} is suitable for agriculture with good environmental conditions. Focus on sustainable practices.`
                  : `${taluka.name} requires careful agricultural planning considering local climate patterns and soil characteristics.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
