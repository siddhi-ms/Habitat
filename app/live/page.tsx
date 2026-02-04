"use client";

import { useMemo, useState } from "react";
import { MapContainer } from "./MapContainer";
import { LayerToggle, type OverlayMode } from "./LayerToggle";
import { DistrictInfoPanel, type DistrictPanelData } from "./DistrictInfoPanel";
import { SearchBar, type SearchLocation } from "./SearchBar";
import { TalukaInfoPanel } from "./TalukaInfoPanel";
import type { Taluka } from "./sindhudurgTalukas";

export default function LivePage() {
  const [overlay, setOverlay] = useState<OverlayMode>("none");
  const [panel, setPanel] = useState<DistrictPanelData | null>(null);
  const [talukaPanel, setTalukaPanel] = useState<Taluka | null>(null);
  const [showExtendedLayers, setShowExtendedLayers] = useState(false);
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);

  const handleLocationSearch = (location: SearchLocation) => {
    setSearchLocation(location);
  };

  const handleTalukaSelect = (taluka: Taluka) => {
    setTalukaPanel(taluka);
    setPanel(null); // Close district panel if open
    setShowExtendedLayers(true); // Show extended layers in Sindhudurg view
  };

  const handleTalukaClear = () => {
    setTalukaPanel(null);
  };

  const handleDistrictSelect = (data: DistrictPanelData) => {
    setPanel(data);
    setTalukaPanel(null); // Close taluka panel if open
    
    // Check if this is Sindhudurg
    if (data.districtName === "Sindhudurg") {
      setShowExtendedLayers(true);
    }
  };

  const handleDistrictClear = () => {
    setPanel(null);
    setShowExtendedLayers(false);
  };

  const headerSubtitle = useMemo(
    () => "Live Intelligence Map • City-level environmental analysis for Sindhudurg",
    [],
  );

  return (
    <div className="h-dvh w-full bg-[#07120C] text-zinc-50 map-container">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-[1400px] items-start justify-between gap-4 px-5 pt-5">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
            <div className="text-xs font-medium tracking-wide text-emerald-100/90">
              HABITAT • LIVE MODE
            </div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight">
              Land Analysis Dashboard — Maharashtra → Sindhudurg
            </div>
            <div className="mt-1 text-sm text-zinc-200/80">{headerSubtitle}</div>
          </div>

          <div className="flex flex-col gap-3 pointer-events-auto">
            <SearchBar onLocationSelect={handleLocationSearch} />
            <div className="hidden sm:block">
              <LayerToggle 
                value={overlay} 
                onChange={setOverlay} 
                showExtended={showExtendedLayers}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-full w-full">
        <MapContainer
          overlay={overlay}
          onDistrictSelect={handleDistrictSelect}
          onDistrictClear={handleDistrictClear}
          onTalukaSelect={handleTalukaSelect}
          onTalukaClear={handleTalukaClear}
          searchLocation={searchLocation}
        />

        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto sm:hidden">
          <LayerToggle 
            value={overlay} 
            onChange={setOverlay} 
            compact 
            showExtended={showExtendedLayers}
          />
        </div>

        <DistrictInfoPanel data={panel} onClose={handleDistrictClear} />
        <TalukaInfoPanel taluka={talukaPanel} onClose={handleTalukaClear} />
      </div>
    </div>
  );
}

