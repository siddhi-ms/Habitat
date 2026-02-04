"use client";

export type OverlayMode = "none" | "rainfall" | "fertility" | "climate" | "temperature" | "suitability";

function ToggleButton({
  active,
  label,
  onClick,
  compact,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border text-xs font-semibold tracking-wide transition",
        compact ? "px-3 py-2" : "px-3.5 py-2",
        active
          ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-50"
          : "border-white/10 bg-black/25 text-zinc-100 hover:bg-black/35",
      ].join(" ")}
      suppressHydrationWarning
    >
      {label}
    </button>
  );
}

export function LayerToggle({
  value,
  onChange,
  compact,
  showExtended = false,
}: {
  value: OverlayMode;
  onChange: (v: OverlayMode) => void;
  compact?: boolean;
  showExtended?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur">
      <div className="px-1 pb-2 text-[11px] font-semibold tracking-wide text-zinc-200/80">
        {showExtended ? "Environmental Layers" : "Overlay"}
      </div>
      <div className={`flex items-center gap-2 ${showExtended ? "flex-wrap" : ""}`}>
        <ToggleButton
          compact={compact}
          active={value === "rainfall"}
          label="Rainfall"
          onClick={() => onChange("rainfall")}
        />
        {showExtended && (
          <ToggleButton
            compact={compact}
            active={value === "temperature"}
            label="Temperature"
            onClick={() => onChange("temperature")}
          />
        )}
        <ToggleButton
          compact={compact}
          active={value === "fertility"}
          label="Soil Fertility"
          onClick={() => onChange("fertility")}
        />
        <ToggleButton
          compact={compact}
          active={value === "climate"}
          label="Climate Risk"
          onClick={() => onChange("climate")}
        />
        {showExtended && (
          <ToggleButton
            compact={compact}
            active={value === "suitability"}
            label="Suitability"
            onClick={() => onChange("suitability")}
          />
        )}
      </div>
    </div>
  );
}

