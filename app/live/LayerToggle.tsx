"use client";

export type OverlayMode = "rainfall" | "fertility" | "climate";

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
    >
      {label}
    </button>
  );
}

export function LayerToggle({
  value,
  onChange,
  compact,
}: {
  value: OverlayMode;
  onChange: (v: OverlayMode) => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur">
      <div className="px-1 pb-2 text-[11px] font-semibold tracking-wide text-zinc-200/80">
        Overlay
      </div>
      <div className="flex items-center gap-2">
        <ToggleButton
          compact={compact}
          active={value === "rainfall"}
          label="Rainfall"
          onClick={() => onChange("rainfall")}
        />
        <ToggleButton
          compact={compact}
          active={value === "fertility"}
          label="Soil fertility"
          onClick={() => onChange("fertility")}
        />
        <ToggleButton
          compact={compact}
          active={value === "climate"}
          label="Climate risk"
          onClick={() => onChange("climate")}
        />
      </div>
    </div>
  );
}

