"use client";

import maplibregl, {
  type ExpressionSpecification,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OverlayMode } from "./LayerToggle";
import { Tooltip, type TooltipData } from "./Tooltip";
import {
  INDIA_STATES_GEOJSON,
  MAHARASHTRA_DISTRICTS_GEOJSON,
  type DistrictProps,
  type IndiaStateProps,
} from "./geo";
import { deriveSuitability } from "./scoring";
import type { DistrictPanelData } from "./DistrictInfoPanel";

type ViewMode = "india" | "maharashtra";

const INDIA_CENTER: [number, number] = [78.9629, 21.5937];
const MAHARASHTRA_CENTER: [number, number] = [75.7139, 19.7515];

const LAYERS = {
  statesFill: "states-fill",
  statesOutline: "states-outline",
  districtsFill: "districts-fill",
  districtsOutline: "districts-outline",
  districtsHover: "districts-hover",
};

function rainfallColorExpression() {
  // Interpolate rainfall (mm) -> pastel gradient.
  return [
    "interpolate",
    ["linear"],
    ["get", "avg_rainfall"],
    500,
    "#fed7aa", // pastel peach (dry)
    800,
    "#fde68a", // pastel yellow
    1000,
    "#a7f3d0", // pastel green
    1300,
    "#bae6fd", // pastel blue (wet)
  ] as const;
}

function fertilityColorExpression() {
  return [
    "match",
    ["get", "fertility_index"],
    "High",
    "#bbf7d0", // pastel green
    "Medium",
    "#fef08a", // pastel yellow
    "Low",
    "#fed7aa", // pastel orange
    "#e0e7ff", // pastel gray
  ] as const;
}

function climateColorExpression() {
  return [
    "match",
    ["get", "climate_risk"],
    "Low",
    "#a7f3d0", // pastel green
    "Moderate",
    "#fef08a", // pastel yellow
    "High",
    "#fecaca", // pastel red
    "#e0e7ff", // pastel gray
  ] as const;
}

function overlayExpression(mode: OverlayMode) {
  if (mode === "rainfall") return rainfallColorExpression();
  if (mode === "climate") return climateColorExpression();
  return fertilityColorExpression();
}

function toDistrictPanelData(props: DistrictProps): DistrictPanelData {
  const insight = deriveSuitability(props);
  return {
    districtName: props.name,
    environmentalSummary: insight.summaryBullets,
    suitabilityScore: insight.score,
    recommendedStrategy: insight.recommendedStrategy,
    rationale: insight.rationale,
  };
}

export function MapContainer({
  overlay,
  onDistrictSelect,
  onDistrictClear,
}: {
  overlay: OverlayMode;
  onDistrictSelect: (data: DistrictPanelData) => void;
  onDistrictClear: () => void;
}) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("india");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const legend = useMemo(() => {
    if (overlay === "none") {
      return {
        title: "Select an overlay",
        items: [
          { label: "No data layer active", color: "transparent" },
        ],
      };
    }
    if (overlay === "rainfall") {
      return {
        title: "Rainfall (mm/year)",
        items: [
          { label: "≤ 500", color: "#fed7aa" },
          { label: "800", color: "#fde68a" },
          { label: "1000", color: "#a7f3d0" },
          { label: "≥ 1300", color: "#bae6fd" },
        ],
      };
    }
    if (overlay === "climate") {
      return {
        title: "Climate risk",
        items: [
          { label: "Low", color: "#a7f3d0" },
          { label: "Moderate", color: "#fef08a" },
          { label: "High", color: "#fecaca" },
        ],
      };
    }
    return {
      title: "Soil fertility index",
      items: [
        { label: "High", color: "#bbf7d0" },
        { label: "Medium", color: "#fef08a" },
        { label: "Low", color: "#fed7aa" },
      ],
    };
  }, [overlay]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // Prevent multiple initializations

    console.log("Initializing map...", containerRef.current);
    console.log("Container dimensions:", {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      offsetWidth: containerRef.current.offsetWidth,
      offsetHeight: containerRef.current.offsetHeight,
    });

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {
          'terrain': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri'
          },
          'topo-overlay': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri'
          }
        },
        layers: [
          {
            id: 'terrain-layer',
            type: 'raster',
            source: 'terrain'
          },
          {
            id: 'topo-overlay-layer',
            type: 'raster',
            source: 'topo-overlay',
            paint: {
              'raster-opacity': 0.7
            }
          }
        ]
      },
      center: INDIA_CENTER,
      zoom: 4.2,
      minZoom: 3.5,
      maxZoom: 12,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "bottom-right",
    );

    map.on("error", (e) => {
      console.error("Map error:", e);
    });

    map.on("load", () => {
      console.log("Map loaded successfully!");
      console.log("Map style loaded, adding sources and layers...");
      // Sources
      map.addSource("india-states", {
        type: "geojson",
        data: INDIA_STATES_GEOJSON as unknown as GeoJSON.FeatureCollection,
      });
      map.addSource("mh-districts", {
        type: "geojson",
        data: MAHARASHTRA_DISTRICTS_GEOJSON as unknown as GeoJSON.FeatureCollection,
      });

      // India states - hidden by default, shows data when overlay is selected
      map.addLayer({
        id: LAYERS.statesFill,
        type: "fill",
        source: "india-states",
        layout: {
          visibility: "none",
        },
        paint: {
          "fill-color": rainfallColorExpression() as unknown as ExpressionSpecification,
          "fill-opacity": 0.5,
        },
      });

      map.addLayer({
        id: LAYERS.statesOutline,
        type: "line",
        source: "india-states",
        layout: {
          visibility: "none",
        },
        paint: {
          "line-color": "#d4af37",
          "line-width": 2,
          "line-opacity": 0.7,
        },
      });

      // Add state labels
      map.addLayer({
        id: "states-labels",
        type: "symbol",
        source: "india-states",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 15,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 2.5,
        },
      });

      // Emphasize Maharashtra at India view

      // District layers (hidden until Maharashtra view)
      map.addLayer({
        id: LAYERS.districtsFill,
        type: "fill",
        source: "mh-districts",
        layout: { visibility: "none" },
        paint: {
          "fill-color": overlayExpression("fertility") as unknown as ExpressionSpecification,
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: LAYERS.districtsOutline,
        type: "line",
        source: "mh-districts",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#FFD700",
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: LAYERS.districtsHover,
        type: "line",
        source: "mh-districts",
        layout: { visibility: "none" },
        paint: {
          "line-color": "rgba(255,255,255,0.9)",
          "line-width": 3,
        },
        filter: ["==", ["get", "name"], ""],
      });

      // Add district labels
      map.addLayer({
        id: "districts-labels",
        type: "symbol",
        source: "mh-districts",
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": 13,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });

      const switchToMaharashtra = () => {
        if (!mapRef.current) return;
        setViewMode("maharashtra");

        // Cinematic camera move.
        mapRef.current.easeTo({
          center: MAHARASHTRA_CENTER,
          zoom: 6.4,
          pitch: 45,
          bearing: -12,
          duration: 1400,
          essential: true,
        });

        // Fade out India layers.
        mapRef.current.setPaintProperty(LAYERS.statesFill, "fill-opacity", 0.15);
        mapRef.current.setPaintProperty(LAYERS.statesOutline, "line-opacity", 0.15);

        // Bold Maharashtra outline for transition cue.

        // Reveal districts a moment later for "cinema" feel.
        window.setTimeout(() => {
          const m = mapRef.current;
          if (!m) return;
          m.setLayoutProperty(LAYERS.districtsFill, "visibility", "visible");
          m.setLayoutProperty(LAYERS.districtsOutline, "visibility", "visible");
          m.setLayoutProperty(LAYERS.districtsHover, "visibility", "visible");
          m.setLayoutProperty("districts-labels", "visibility", "visible");
          m.setPaintProperty(
            LAYERS.districtsFill,
            "fill-color",
            overlayExpression(overlay) as unknown as ExpressionSpecification,
          );

          // Fully hide state layer to reduce clutter.
          m.setLayoutProperty(LAYERS.statesFill, "visibility", "none");
          m.setLayoutProperty(LAYERS.statesOutline, "visibility", "none");
          m.setLayoutProperty("states-labels", "visibility", "none");
        }, 520);
      };

      map.on("click", LAYERS.statesFill, (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const p = f.properties as unknown as IndiaStateProps;
        if (p.name === "Maharashtra") switchToMaharashtra();
      });

      map.on("zoomend", () => {
        const m = mapRef.current;
        if (!m) return;
        if (viewMode === "india" && m.getZoom() >= 6.2) {
          switchToMaharashtra();
        }
      });

      map.on("mousemove", (e) => {
        const m = mapRef.current;
        if (!m) return;

        const layers = viewMode === "maharashtra" ? [LAYERS.districtsFill] : [LAYERS.statesFill];
        const features = m.queryRenderedFeatures(e.point, { layers });
        const feature = features?.[0];

        if (!feature?.properties) {
          setTooltip(null);
          m.getCanvas().style.cursor = "";
          if (viewMode === "maharashtra") {
            m.setFilter(LAYERS.districtsHover, ["==", ["get", "name"], ""]);
          }
          return;
        }

        m.getCanvas().style.cursor = "pointer";

        if (viewMode === "india") {
          const p = feature.properties as unknown as IndiaStateProps;
          setTooltip({
            title: p.name,
            x: e.point.x,
            y: e.point.y,
            lines: [
              { label: "Avg rainfall", value: `~${p.avg_rainfall} mm` },
              { label: "Dominant soil", value: p.soil_type },
              { label: "Climate zone", value: p.climate_zone },
              p.name === "Maharashtra"
                ? { label: "Action", value: "Click to zoom in" }
                : { label: "Action", value: "Scroll/zoom in" },
            ],
          });
        } else {
          const p = feature.properties as unknown as DistrictProps;
          m.setFilter(LAYERS.districtsHover, ["==", ["get", "name"], p.name]);
          setTooltip({
            title: p.name,
            x: e.point.x,
            y: e.point.y,
            lines: [
              { label: "Rainfall", value: p.rainfall_range },
              { label: "Soil type", value: p.soil_type },
              { label: "Fertility", value: p.fertility_index },
              { label: "Climate risk", value: p.climate_risk },
              { label: "Suitability", value: `${deriveSuitability(p).score}/100` },
            ],
          });
        }
      });

      map.on("click", LAYERS.districtsFill, (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const p = f.properties as unknown as DistrictProps;
        onDistrictSelect(toDistrictPanelData(p));
      });

      map.on("click", (e) => {
        // Click outside district -> close panel (only when in Maharashtra view)
        const m = mapRef.current;
        if (!m || viewMode !== "maharashtra") return;
        const features = m.queryRenderedFeatures(e.point, { layers: [LAYERS.districtsFill] });
        if (!features?.length) onDistrictClear();
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (viewMode !== "maharashtra") return;
    if (!m.getLayer(LAYERS.districtsFill)) return;
    m.setPaintProperty(
      LAYERS.districtsFill,
      "fill-color",
      overlayExpression(overlay) as unknown as ExpressionSpecification,
    );
  }, [overlay, viewMode]);

  // Toggle states fill layer visibility and color based on overlay selection
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (!m.getLayer(LAYERS.statesFill)) return;
      if (!m.getLayer(LAYERS.statesOutline)) return;
    
    if (overlay === "none") {
      // Hide data layer and borders when no overlay is selected
        m.setLayoutProperty(LAYERS.statesOutline, "visibility", "none");
      m.setLayoutProperty(LAYERS.statesFill, "visibility", "none");
    } else {
      // Update color based on overlay mode
      m.setPaintProperty(
        LAYERS.statesFill,
        "fill-color",
        overlayExpression(overlay) as unknown as ExpressionSpecification,
      );
      
      // Show both data layer and borders when overlay is active
      if (viewMode === "india") {
        m.setLayoutProperty(LAYERS.statesFill, "visibility", "visible");
        m.setLayoutProperty(LAYERS.statesOutline, "visibility", "visible");
      }
    }
  }, [overlay, viewMode]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
      />

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/45 via-transparent to-black/55" />

      <div className="pointer-events-none absolute left-5 top-24 z-20 hidden sm:block">
        <div className="pointer-events-auto w-[320px] rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
          <div className="text-[11px] font-semibold tracking-wide text-zinc-200/75">
            {viewMode === "india" ? "India overview" : "Maharashtra intelligence"}
          </div>
          <div className="mt-1 text-sm text-zinc-50">
            {viewMode === "india"
              ? "Select an overlay above to visualize rainfall, soil fertility, or climate risk data across Indian states."
              : "District-level attributes drive overlays. Hover for details; click for decision panel."}
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-semibold tracking-wide text-zinc-200/75">
              Legend — {legend.title}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {legend.items.map((it) => (
                <div key={it.label} className="flex items-center gap-2 text-xs text-zinc-100/85">
                  <span
                    className="h-3.5 w-3.5 rounded border border-white/10"
                    style={{ background: it.color }}
                  />
                  <span>{it.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-100/80">
            <div className="font-semibold text-zinc-50">Demo note</div>
            <div className="mt-1">
              Data is read dynamically from GeoJSON feature properties (no hardcoded tooltip/panel
              values).
            </div>
          </div>
        </div>
      </div>

      <Tooltip data={tooltip} />
    </div>
  );
}

