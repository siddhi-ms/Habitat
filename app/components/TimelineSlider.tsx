"use client";

interface TimelineSliderProps {
  currentYear: number;
  maxYears: number;
  onChange: (year: number) => void;
}

export function TimelineSlider({ currentYear, maxYears, onChange }: TimelineSliderProps) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Year {currentYear.toFixed(1)}</span>
        <span className="text-zinc-500">/ {maxYears} years to maturity</span>
      </div>

      <input
        type="range"
        min="0"
        max={maxYears}
        step="0.1"
        value={currentYear}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer 
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:w-4 
                   [&::-webkit-slider-thumb]:h-4 
                   [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:bg-emerald-500
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-emerald-500
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-pointer"
      />

      <div className="flex justify-between text-xs text-zinc-500">
        <span>Planted</span>
        <span>Mature</span>
      </div>
    </div>
  );
}
