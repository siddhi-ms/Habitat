"use client";

export type TooltipData = {
  title: string;
  lines: Array<{ label: string; value: string }>;
  x: number;
  y: number;
};

export function Tooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;

  return (
    <div
      className="pointer-events-none absolute z-30 w-[260px] -translate-y-2 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 shadow-xl backdrop-blur"
      style={{ left: data.x + 12, top: data.y + 12 }}
    >
      <div className="text-[11px] font-semibold tracking-wide text-emerald-100/90">
        {data.title}
      </div>
      <div className="mt-1 space-y-1">
        {data.lines.map((l) => (
          <div key={l.label} className="flex items-start justify-between gap-3">
            <div className="text-zinc-200/80">{l.label}</div>
            <div className="text-right font-medium text-zinc-50">{l.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

