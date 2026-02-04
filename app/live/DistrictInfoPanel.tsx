"use client";

import { motion, AnimatePresence } from "framer-motion";

export type DistrictPanelData = {
  districtName: string;
  environmentalSummary: string[];
  suitabilityScore: number;
  recommendedStrategy: string[];
  rationale: Array<{ label: string; value: string }>;
};

export function DistrictInfoPanel({
  data,
  onClose,
}: {
  data: DistrictPanelData | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {data ? (
        <>
          <motion.div
            className="absolute inset-0 z-30 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="absolute right-0 top-0 z-40 h-full w-full max-w-[420px] border-l border-white/10 bg-[#08160F]/95 p-5 text-zinc-50 shadow-2xl backdrop-blur"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-emerald-200/80">
                  DISTRICT INTELLIGENCE
                </div>
                <div className="mt-0.5 text-xl font-semibold tracking-tight">
                  {data.districtName}
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-black/40"
                onClick={onClose}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-sm font-semibold text-zinc-50">
                  Environmental Summary
                </div>
                <ul className="mt-2 space-y-1 text-sm text-zinc-100/85">
                  {data.environmentalSummary.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-50">
                    Reforestation Suitability
                  </div>
                  <div className="text-sm font-semibold text-emerald-200">
                    {data.suitabilityScore} / 100
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 via-emerald-300/70 to-lime-300/70"
                    style={{ width: `${data.suitabilityScore}%` }}
                  />
                </div>
                <div className="mt-3 text-[11px] font-medium tracking-wide text-zinc-200/70">
                  Derived from rainfall, fertility, vegetation baseline, and climate risk.
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-sm font-semibold text-zinc-50">
                  Recommended Strategy
                </div>
                <ul className="mt-2 space-y-1 text-sm text-zinc-100/85">
                  {data.recommendedStrategy.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300/70" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-sm font-semibold text-zinc-50">
                  Why this score
                </div>
                <div className="mt-2 space-y-1 text-xs text-zinc-100/85">
                  {data.rationale.map((r) => (
                    <div key={r.label} className="flex justify-between gap-3">
                      <div className="text-zinc-200/70">{r.label}</div>
                      <div className="font-semibold text-zinc-50">{r.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

