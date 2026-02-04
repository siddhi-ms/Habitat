"use client";

import { useMemo, useState } from "react";
import { MapContainer } from "./MapContainer";
import { LayerToggle, type OverlayMode } from "./LayerToggle";
import { DistrictInfoPanel, type DistrictPanelData } from "./DistrictInfoPanel";

export default function LivePage() {
  const [overlay, setOverlay] = useState<OverlayMode>("fertility");
  const [panel, setPanel] = useState<DistrictPanelData | null>(null);

  const headerSubtitle = useMemo(
    () => "Live Intelligence Map • Planning phase decision support",
    [],
  );

  return (
    <div className="h-dvh w-full bg-[#07120C] text-zinc-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-[1400px] items-start justify-between gap-4 px-5 pt-5">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
            <div className="text-xs font-medium tracking-wide text-emerald-100/90">
              HABITAT • LIVE MODE
            </div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight">
              Adaptive Reforestation Intelligence — India → Maharashtra
            </div>
            <div className="mt-1 text-sm text-zinc-200/80">{headerSubtitle}</div>
          </div>

          <div className="pointer-events-auto hidden sm:block">
            <LayerToggle value={overlay} onChange={setOverlay} />
          </div>
        </div>
      </div>

      <div className="relative h-full w-full">
        <MapContainer
          overlay={overlay}
          onDistrictSelect={(data) => setPanel(data)}
          onDistrictClear={() => setPanel(null)}
        />

        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto sm:hidden">
          <LayerToggle value={overlay} onChange={setOverlay} compact />
        </div>

        <DistrictInfoPanel data={panel} onClose={() => setPanel(null)} />
      </div>
    </div>
  );
}

