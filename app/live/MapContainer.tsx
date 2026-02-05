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
import type { SearchLocation } from "./SearchBar";
import {
  getSindhudurgTalukasGeoJSON,
  getSindhudurgVillagesGeoJSON,
  type Taluka,
  type Village,
  getRainfallColor,
  getTemperatureColor,
  getSoilFertilityColor,
  getClimateRiskColor,
  getSuitabilityColor,
  getVillagesByTaluka,
} from "./sindhudurgTalukas";

type ViewMode = "india" | "maharashtra" | "sindhudurg" | "taluka" | "village";

const INDIA_CENTER: [number, number] = [78.9629, 21.5937];
const MAHARASHTRA_CENTER: [number, number] = [75.7139, 19.7515];
// Centered on Sindhudurg district - deep zoom for land/street level view
const SINDHUDURG_CENTER: [number, number] = [73.6597, 16.1180];
const SINDHUDURG_ZOOM: number = 12.5;

const LAYERS = {
  statesFill: "states-fill",
  statesOutline: "states-outline",
  districtsFill: "districts-fill",
  districtsOutline: "districts-outline",
  districtsHover: "districts-hover",
  talukasFill: "talukas-fill",
  talukasOutline: "talukas-outline",
  talukasHover: "talukas-hover",
  talukasCircle: "talukas-circle",
  talukasCircleLabel: "talukas-circle-label",
  villagesCircle: "villages-circle",
  villagesLabel: "villages-label",
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
  if (mode === "temperature") return temperatureColorExpression();
  if (mode === "suitability") return suitabilityColorExpression();
  return fertilityColorExpression();
}

function temperatureColorExpression() {
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "avg_temp"], 26],
    24,
    "#bae6fd", // cool blue
    27,
    "#a7f3d0", // comfortable green
    30,
    "#fef08a", // warm yellow
    33,
    "#fecaca", // hot red
  ] as const;
}

function suitabilityColorExpression() {
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "suitability_score"], 70],
    0,
    "#fecaca", // poor red
    40,
    "#fef08a", // fair yellow
    60,
    "#a7f3d0", // good green
    75,
    "#6ee7b7", // excellent teal
    100,
    "#34d399", // outstanding
  ] as const;
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
  onTalukaSelect,
  onTalukaClear,
  searchLocation,
}: {
  overlay: OverlayMode;
  onDistrictSelect: (data: DistrictPanelData) => void;
  onDistrictClear: () => void;
  onTalukaSelect?: (taluka: Taluka) => void;
  onTalukaClear?: () => void;
  searchLocation?: SearchLocation | null;
}) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // HARD LOCK: Use Ref instead of State for instant "Do Not Disturb" blocking
  const isSindhudurgLocked = useRef(false);

  const [viewMode, setViewMode] = useState<ViewMode>("india");
  const [currentTaluka, setCurrentTaluka] = useState<Taluka | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const [viewLocked, setViewLocked] = useState(false);

  // Handle search location changes - prevent animation conflicts and stay zoomed
  useEffect(() => {
    if (!searchLocation || !mapRef.current) return;
    
    const map = mapRef.current;
    const { center, zoom, type } = searchLocation;
    
    // Mark as user interaction to prevent auto zoom-out
    setUserInteracting(true);
    
    // Update view mode based on search type
    if (type === "district") {
      setViewMode("sindhudurg");
    } else if (type === "taluka") {
      setViewMode("taluka");
    } else if (type === "village") {
      setViewMode("village");
    }
    
    // Update layer visibility immediately before animation
    if (type === "district" || type === "taluka" || type === "village") {
      map.setLayoutProperty(LAYERS.talukasFill, "visibility", "visible");
      map.setLayoutProperty(LAYERS.talukasOutline, "visibility", "visible");
      map.setLayoutProperty("talukas-labels", "visibility", "visible");
    }
    
    if (type === "taluka" || type === "village") {
      map.setLayoutProperty(LAYERS.villagesCircle, "visibility", "visible");
      map.setLayoutProperty(LAYERS.villagesLabel, "visibility", "visible");
    }
    
    // Zoom and STAY at the searched location
    map.easeTo({
      center,
      zoom,
      pitch: 0,
      duration: 1000,
      essential: true,
    });
    
    // Reset interaction flag after animation
    setTimeout(() => setUserInteracting(false), 1200);
  }, [searchLocation]);

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
        title: viewMode === "sindhudurg" ? "Rainfall (90-day mm)" : "Rainfall (mm/year)",
        items: viewMode === "sindhudurg" ? [
          { label: "< 1000", color: "#fef08a" },
          { label: "1000-1150", color: "#a7f3d0" },
          { label: "1150-1250", color: "#6ee7b7" },
          { label: "> 1250", color: "#34d399" },
        ] : [
          { label: "≤ 500", color: "#fed7aa" },
          { label: "800", color: "#fde68a" },
          { label: "1000", color: "#a7f3d0" },
          { label: "≥ 1300", color: "#bae6fd" },
        ],
      };
    }
    if (overlay === "temperature") {
      return {
        title: "Temperature (°C)",
        items: [
          { label: "< 24", color: "#bae6fd" },
          { label: "24-27", color: "#a7f3d0" },
          { label: "27-30", color: "#fef08a" },
          { label: "> 30", color: "#fecaca" },
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
    if (overlay === "suitability") {
      return {
        title: "Land Suitability",
        items: [
          { label: "Poor (0-40)", color: "#fecaca" },
          { label: "Fair (40-60)", color: "#fef08a" },
          { label: "Good (60-75)", color: "#a7f3d0" },
          { label: "Excellent (75+)", color: "#6ee7b7" },
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
  }, [overlay, viewMode]);

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
      maxZoom: 18, // Increase max zoom for village/land-level exploration
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
      
      // Sindhudurg talukas source (loaded but hidden until Sindhudurg view)
      map.addSource("sindhudurg-talukas", {
        type: "geojson",
        data: getSindhudurgTalukasGeoJSON() as unknown as GeoJSON.FeatureCollection,
      });

      // Sindhudurg villages source (point features for village-level exploration)
      map.addSource("sindhudurg-villages", {
        type: "geojson",
        data: getSindhudurgVillagesGeoJSON() as unknown as GeoJSON.FeatureCollection,
      });

      // Attempt to replace static sources with live data from the Groq proxy
      (async () => {
        try {
          const tryFetch = async (type: string, sourceId: string) => {
            const resp = await fetch('/api/groq', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type }),
            });
            if (!resp.ok) return null;
            const json = await resp.json();
            if (json && json.features && map.getSource(sourceId)) {
              (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(json);
              return true;
            }
            return null;
          };

          await tryFetch('india_states', 'india-states');
          await tryFetch('maharashtra_districts', 'mh-districts');
          await tryFetch('sindhudurg_talukas', 'sindhudurg-talukas');
          await tryFetch('sindhudurg_villages', 'sindhudurg-villages');
        } catch (err) {
          // Keep static data on any failure; log for debugging.
          // eslint-disable-next-line no-console
          console.warn('Live Groq fetch failed, using static data', err);
        }
      })();

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

      // Sindhudurg talukas (hidden until Sindhudurg view)
      map.addLayer({
        id: LAYERS.talukasFill,
        type: "fill",
        source: "sindhudurg-talukas",
        layout: { visibility: "none" },
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "rainfall_90d"],
            1000,
            "#fef08a",
            1150,
            "#a7f3d0",
            1250,
            "#6ee7b7",
            1350,
            "#34d399",
          ] as unknown as ExpressionSpecification,
          "fill-opacity": 0.6,
        },
      });

      map.addLayer({
        id: LAYERS.talukasOutline,
        type: "line",
        source: "sindhudurg-talukas",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#FFD700",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 2,
            12, 3,
            14, 4,
          ],
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: LAYERS.talukasHover,
        type: "line",
        source: "sindhudurg-talukas",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#34d399",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 4,
            12, 5,
            14, 6,
          ],
          "line-opacity": 1,
        },
        filter: ["==", ["get", "id"], ""],
      });

      // Add taluka labels
      map.addLayer({
        id: "talukas-labels",
        type: "symbol",
        source: "sindhudurg-talukas",
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
          "text-size": 12,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });

      // Taluka circle markers (VISIBLE BLUE DOTS for LOD system)
      map.addLayer({
        id: LAYERS.talukasCircle,
        type: "circle",
        source: "sindhudurg-talukas",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 8,
            12, 10,
            14, 12,
          ],
          "circle-color": "#3b82f6", // Blue for Talukas (LOD Level 1)
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.9,
        },
      });

      // Taluka circle labels (permanent labels with good readability)
      map.addLayer({
        id: LAYERS.talukasCircleLabel,
        type: "symbol",
        source: "sindhudurg-talukas",
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 11,
            12, 13,
            14, 15,
          ],
          "text-anchor": "top",
          "text-offset": [0, 0.8], // Position label above the blue dot
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 2.5,
        },
      });

      // Village markers (VISIBLE GREEN DOTS for LOD Level 2 - zoom 13+)
      map.addLayer({
        id: LAYERS.villagesCircle,
        type: "circle",
        source: "sindhudurg-villages",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13, 5,
            14, 6,
            16, 8,
          ],
          "circle-color": "#10b981", // Green for Villages (LOD Level 2)
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.85,
        },
      });

      // Village labels (permanent labels at zoom 13+)
      map.addLayer({
        id: LAYERS.villagesLabel,
        type: "symbol",
        source: "sindhudurg-villages",
        layout: {
          visibility: "none",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13, 9,
            14, 10,
            15, 11,
            16, 12,
          ],
          "text-anchor": "top",
          "text-offset": [0, 0.6], // Position label above the green dot
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
        isSindhudurgLocked.current = false; // Unlock the hard lock
        setViewLocked(true);

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
        
        // Unlock view after transition
        setTimeout(() => setViewLocked(false), 2000);
      };

      const switchToSindhudurg = () => {
        if (!mapRef.current) return;
        const m = mapRef.current;
        
        // Stop any ongoing animations
        m.stop();
        
        // HARD LOCK: Instantly set the ref (no re-render delay)
        isSindhudurgLocked.current = true;
        
        // Lock the view AND mark Sindhudurg as selected (prevents snap-back)
        setViewLocked(true);
        setViewMode("sindhudurg");
        onDistrictClear();

        // Hide district layers immediately
        m.setLayoutProperty(LAYERS.districtsFill, "visibility", "none");
        m.setLayoutProperty(LAYERS.districtsOutline, "visibility", "none");
        m.setLayoutProperty(LAYERS.districtsHover, "visibility", "none");
        m.setLayoutProperty("districts-labels", "visibility", "none");
        
        // SINDHUDURG-SPECIFIC: Hide messy polygon boundaries, show clean markers
        m.setLayoutProperty(LAYERS.talukasFill, "visibility", "none");
        m.setLayoutProperty(LAYERS.talukasOutline, "visibility", "none");
        m.setLayoutProperty(LAYERS.talukasHover, "visibility", "none");
        m.setLayoutProperty("talukas-labels", "visibility", "none");
        
        // Show clean invisible markers with labels only
        m.setLayoutProperty(LAYERS.talukasCircle, "visibility", "visible");
        m.setLayoutProperty(LAYERS.talukasCircleLabel, "visibility", "visible");
        
        // Update circle marker colors based on overlay
        updateTalukaCircleColors(overlay);

        // Deep zoom with flyTo for land-level detail
        m.flyTo({
          center: SINDHUDURG_CENTER,
          zoom: SINDHUDURG_ZOOM,
          pitch: 0,
          bearing: 0,
          duration: 1500,
          essential: true,
        });
        
        // Unlock view after animation completes, but keep Sindhudurg selected
        setTimeout(() => setViewLocked(false), 2000);
      };

      const updateTalukaCircleColors = (mode: OverlayMode) => {
        const m = mapRef.current;
        if (!m || !m.getLayer(LAYERS.talukasCircle)) return;
        
        let colorExpression: ExpressionSpecification;
        
        switch (mode) {
          case "rainfall":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "rainfall_90d"],
              1000, "#fef08a",
              1150, "#a7f3d0",
              1250, "#6ee7b7",
              1350, "#34d399",
            ] as unknown as ExpressionSpecification;
            break;
          case "temperature":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "avg_temp"],
              25, "#bae6fd",
              26, "#a7f3d0",
              27, "#fef08a",
              28, "#fecaca",
            ] as unknown as ExpressionSpecification;
            break;
          case "fertility":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "fertility_score"],
              0, "#fed7aa",
              70, "#fef08a",
              80, "#a7f3d0",
              85, "#bbf7d0",
              100, "#6ee7b7",
            ] as unknown as ExpressionSpecification;
            break;
          case "climate":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "climate_risk_score"],
              0, "#a7f3d0",
              12, "#fef08a",
              18, "#fed7aa",
              25, "#fecaca",
              100, "#ef4444",
            ] as unknown as ExpressionSpecification;
            break;
          case "suitability":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "suitability_score"],
              0, "#fecaca",
              80, "#fef08a",
              84, "#a7f3d0",
              87, "#6ee7b7",
              100, "#34d399",
            ] as unknown as ExpressionSpecification;
            break;
          default:
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "suitability_score"],
              0, "#fecaca",
              80, "#fef08a",
              85, "#a7f3d0",
              90, "#6ee7b7",
            ] as unknown as ExpressionSpecification;
        }
        
        m.setPaintProperty(LAYERS.talukasCircle, "circle-color", colorExpression);
      };

      const updateTalukaColors = (mode: OverlayMode) => {
        const m = mapRef.current;
        if (!m || !m.getLayer(LAYERS.talukasFill)) return;
        
        let colorExpression: ExpressionSpecification;
        
        switch (mode) {
          case "rainfall":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "rainfall_90d"],
              1000, "#fef08a",
              1150, "#a7f3d0",
              1250, "#6ee7b7",
              1350, "#34d399",
            ] as unknown as ExpressionSpecification;
            break;
          case "temperature":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "avg_temp"],
              25, "#bae6fd",
              26, "#a7f3d0",
              27, "#fef08a",
              28, "#fecaca",
            ] as unknown as ExpressionSpecification;
            break;
          case "fertility":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "fertility_score"],
              0, "#fed7aa",
              70, "#fef08a",
              80, "#a7f3d0",
              85, "#bbf7d0",
              100, "#6ee7b7",
            ] as unknown as ExpressionSpecification;
            break;
          case "climate":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "climate_risk_score"],
              0, "#a7f3d0",
              12, "#fef08a",
              18, "#fed7aa",
              25, "#fecaca",
              100, "#ef4444",
            ] as unknown as ExpressionSpecification;
            break;
          case "suitability":
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "suitability_score"],
              0, "#fecaca",
              80, "#fef08a",
              84, "#a7f3d0",
              87, "#6ee7b7",
              100, "#34d399",
            ] as unknown as ExpressionSpecification;
            break;
          default:
            colorExpression = [
              "interpolate",
              ["linear"],
              ["get", "rainfall_90d"],
              1000, "#fef08a",
              1150, "#a7f3d0",
              1250, "#6ee7b7",
              1350, "#34d399",
            ] as unknown as ExpressionSpecification;
        }
        
        m.setPaintProperty(LAYERS.talukasFill, "fill-color", colorExpression);
      };

      map.on("click", LAYERS.statesFill, (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const p = f.properties as unknown as IndiaStateProps;
        if (p.name === "Maharashtra") switchToMaharashtra();
      });

      // Smart zoom-based view mode switching - only when user manually zooms
      map.on("zoomend", () => {
        const m = mapRef.current;
        if (!m) return;
        
        const zoom = m.getZoom();
        const center = m.getCenter();
        
        // AUTO-EXIT: Zoom-Out Restore Feature
        // If user manually zooms out below state level while in Sindhudurg, restore Maharashtra view
        if (viewMode === "sindhudurg" && zoom < 9 && !viewLocked) {
          console.log("Auto-exit triggered: Zooming out from Sindhudurg to Maharashtra");
          isSindhudurgLocked.current = false; // Unlock the hard lock
          setViewMode("maharashtra");
          onDistrictClear();
          
          // Smooth fly back to Maharashtra center
          m.flyTo({
            center: MAHARASHTRA_CENTER,
            zoom: 6.8,
            pitch: 0,
            bearing: 0,
            duration: 1200,
            essential: true,
          });
          
          // Show district layers
          setTimeout(() => {
            m.setLayoutProperty(LAYERS.districtsFill, "visibility", "visible");
            m.setLayoutProperty(LAYERS.districtsOutline, "visibility", "visible");
            m.setLayoutProperty("districts-labels", "visibility", "visible");
            
            // Hide Sindhudurg layers
            m.setLayoutProperty(LAYERS.talukasFill, "visibility", "none");
            m.setLayoutProperty(LAYERS.talukasOutline, "visibility", "none");
            m.setLayoutProperty(LAYERS.talukasCircle, "visibility", "none");
            m.setLayoutProperty(LAYERS.talukasCircleLabel, "visibility", "none");
            m.setLayoutProperty("talukas-labels", "visibility", "none");
            m.setLayoutProperty(LAYERS.villagesCircle, "visibility", "none");
            m.setLayoutProperty(LAYERS.villagesLabel, "visibility", "none");
          }, 200);
          
          return;
        }
        
        // INTERCEPTOR: STOP. Do not touch the camera if Sindhudurg is locked.
        if (isSindhudurgLocked.current) return;
        
        // Don't interfere if view is locked (prevent snap-back)
        if (viewLocked) return;
        
        // Check if we're within Sindhudurg bounds
        const inSindhudurg = center.lng >= 73.2 && center.lng <= 74.0 && 
                             center.lat >= 15.6 && center.lat <= 16.6;
        
        // Only auto-transition on manual scroll zoom from India view
        if (viewMode === "india" && zoom >= 6.2 && !userInteracting) {
          switchToMaharashtra();
        } else if ((viewMode === "sindhudurg" || viewMode === "taluka") && inSindhudurg) {
          // LOD SYSTEM: Level of Detail for Sindhudurg markers
          // Zoom 10-12: Show Taluka markers only (Blue circles with labels)
          // Zoom 13+: Show BOTH Talukas AND Villages (Green circles with labels)
          
          if (zoom >= 13) {
            // High zoom: Show villages with their labels
            m.setLayoutProperty(LAYERS.villagesCircle, "visibility", "visible");
            m.setLayoutProperty(LAYERS.villagesLabel, "visibility", "visible");
            
            // Keep taluka markers visible for context
            m.setLayoutProperty(LAYERS.talukasCircle, "visibility", "visible");
            m.setLayoutProperty(LAYERS.talukasCircleLabel, "visibility", "visible");
          } else if (zoom >= 10) {
            // Medium zoom: Show only talukas, hide villages to prevent clutter
            m.setLayoutProperty(LAYERS.talukasCircle, "visibility", "visible");
            m.setLayoutProperty(LAYERS.talukasCircleLabel, "visibility", "visible");
            
            // Hide villages at this zoom level
            m.setLayoutProperty(LAYERS.villagesCircle, "visibility", "none");
            m.setLayoutProperty(LAYERS.villagesLabel, "visibility", "none");
          } else {
            // Low zoom: Hide all detail markers
            m.setLayoutProperty(LAYERS.talukasCircle, "visibility", "none");
            m.setLayoutProperty(LAYERS.talukasCircleLabel, "visibility", "none");
            m.setLayoutProperty(LAYERS.villagesCircle, "visibility", "none");
            m.setLayoutProperty(LAYERS.villagesLabel, "visibility", "none");
          }
        }
      });

      map.on("mousemove", (e) => {
        const m = mapRef.current;
        if (!m) return;

        // Skip if we're in Sindhudurg view (patches handle their own hover)
        if (viewMode === "sindhudurg") return;

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
              p.name === "Sindhudurg" 
                ? { label: "Action", value: "Click for land analysis" }
                : { label: "Action", value: "Click for details" },
            ],
          });
        }
      });

      map.on("click", LAYERS.districtsFill, async (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const p = f.properties as unknown as DistrictProps;
        
        // Check if clicked district is Sindhudurg
        if (p.name === "Sindhudurg") {
          switchToSindhudurg();
        } else {
          // Try to fetch dynamic data from Groq API
          try {
            // Show loading state (optional, but good UX - maybe pass a loading placeholder first)
            // For now, we'll optimistically try fetching. 
            // Ideally we'd show a spinner in the panel, but onDistrictSelect typically opens it immediately.
            // We can pass a "loading" state if the panel supports it, or just wait.
            // Let's rely on the quick API response or fallback.
            
            const response = await fetch("/api/groq", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                type: "district_intelligence", 
                district: p.name 
              }),
            });

            if (response.ok) {
              const liveData = await response.json();
              if (liveData && liveData.suitabilityScore) {
                 onDistrictSelect(liveData);
                 return;
              }
            }
            throw new Error("Invalid API response");
          } catch (err) {
            console.error("Failed to fetch live district data, falling back to static:", err);
            // Fallback to local calculation
            onDistrictSelect(toDistrictPanelData(p));
          }
        }
      });

      // Taluka click handler - zoom into taluka and STAY there (works with circles for Sindhudurg)
      const handleTalukaClick = (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const props = f.properties;
        
        const m = mapRef.current;
        if (!m) return;
        
        // Stop any ongoing animations
        m.stop();
        
        // Lock view and mark as user-initiated interaction
        setViewLocked(true);
        setUserInteracting(true);
        
        // Reconstruct taluka data
        const talukaData: Taluka = {
          id: props.id,
          name: props.name,
          center: [props.center_lng, props.center_lat],
          bounds: { minLng: 0, maxLng: 0, minLat: 0, maxLat: 0 },
          rainfall_90d: props.rainfall_90d,
          avg_temp: props.avg_temp,
          soil_carbon: props.soil_carbon,
          soil_nitrogen: props.soil_nitrogen,
          soil_ph: props.soil_ph,
          drought_index: props.drought_index,
          heat_stress: props.heat_stress,
          fertility_score: props.fertility_score,
          climate_risk_score: props.climate_risk_score,
          suitability_score: props.suitability_score,
        };
        
        setCurrentTaluka(talukaData);
        setViewMode("taluka");
        
        // Show village markers immediately at this zoom level
        m.setLayoutProperty(LAYERS.villagesCircle, "visibility", "visible");
        m.setLayoutProperty(LAYERS.villagesLabel, "visibility", "visible");
        
        // Zoom in and LOCK at this level
        m.easeTo({
          center: talukaData.center,
          zoom: 14,
          pitch: 0,
          duration: 800,
          essential: true,
        });
        
        // Reset flags after animation completes
        setTimeout(() => {
          setUserInteracting(false);
          setViewLocked(false);
        }, 1100);
        
        // Trigger panel if handler exists
        if (onTalukaSelect) {
          onTalukaSelect(talukaData);
        }
      };
      
      // Bind click handler to both polygon and circle layers
      map.on("click", LAYERS.talukasFill, handleTalukaClick);
      map.on("click", LAYERS.talukasCircle, handleTalukaClick);

      // Taluka hover handler (works with both polygons and circles)
      const handleTalukaHover = (e: MapLayerMouseEvent) => {
        const m = mapRef.current;
        if (!m) return;
        
        const f = e.features?.[0];
        if (!f?.properties) return;
        
        const taluka = f.properties as unknown as Record<string, unknown>;
        m.getCanvas().style.cursor = "pointer";
        m.setFilter(LAYERS.talukasHover, ["==", ["get", "id"], taluka.id as string]);
        
        setTooltip({
          title: taluka.name as string,
          x: e.point.x,
          y: e.point.y,
          lines: [
            { label: "Rainfall (90d)", value: `${taluka.rainfall_90d} mm` },
            { label: "Temperature", value: `${taluka.avg_temp}°C` },
            { label: "Fertility", value: `${taluka.fertility_score}/100` },
            { label: "Suitability", value: `${taluka.suitability_score}/100` },
            { label: "Action", value: "Click for details" },
          ],
        });
      };
      
      // Bind hover handlers to both polygon and circle layers
      map.on("mousemove", LAYERS.talukasFill, handleTalukaHover);
      map.on("mousemove", LAYERS.talukasCircle, handleTalukaHover);

      map.on("mouseleave", LAYERS.talukasFill, () => {
        const m = mapRef.current;
        if (!m) return;
        m.getCanvas().style.cursor = "";
        m.setFilter(LAYERS.talukasHover, ["==", ["get", "id"], ""]);
        if (viewMode === "sindhudurg") {
          setTooltip(null);
        }
      });

      map.on("mouseleave", LAYERS.talukasCircle, () => {
        const m = mapRef.current;
        if (!m) return;
        m.getCanvas().style.cursor = "";
        setTooltip(null);
      });

      // Village click handler - zoom to village level and STAY
      map.on("click", LAYERS.villagesCircle, (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const village = f.properties as unknown as Record<string, unknown>;
        
        const m = mapRef.current;
        if (!m) return;
        
        // Stop any ongoing animations
        m.stop();
        
        // Lock view and mark as user-initiated interaction
        setViewLocked(true);
        setUserInteracting(true);
        // Note: Keep sindhudurgSelected=true since we're still in Sindhudurg district
        
        const villageLng = village.center_lng as number;
        const villageLat = village.center_lat as number;
        const center: [number, number] = villageLng && villageLat 
          ? [villageLng, villageLat] 
          : e.lngLat.toArray() as [number, number];
        
        // Zoom in and LOCK at this level
        m.easeTo({
          center,
          zoom: 15.5,
          pitch: 0,
          duration: 700,
          essential: true,
        });
        
        // Reset flags after animation completes
        setTimeout(() => {
          setUserInteracting(false);
          setViewLocked(false);
        }, 950);
      });

      // Village hover handler
      map.on("mousemove", LAYERS.villagesCircle, (e: MapLayerMouseEvent) => {
        const m = mapRef.current;
        if (!m) return;
        
        const f = e.features?.[0];
        if (!f?.properties) return;
        
        const village = f.properties as unknown as Record<string, unknown>;
        m.getCanvas().style.cursor = "pointer";
        
        setTooltip({
          title: village.name as string,
          x: e.point.x,
          y: e.point.y,
          lines: [
            { label: "Population", value: `${village.population || "N/A"}` },
            { label: "Area", value: `${village.area_sqkm || "N/A"} km²` },
            { label: "Rainfall (90d)", value: `${village.rainfall_90d} mm` },
            { label: "Soil Fertility", value: `${village.soil_fertility}/100` },
            { label: "Suitability", value: `${village.suitability_score}/100` },
            { label: "Action", value: "Click to explore land" },
          ],
        });
      });

      map.on("mouseleave", LAYERS.villagesCircle, () => {
        const m = mapRef.current;
        if (!m) return;
        m.getCanvas().style.cursor = "";
        setTooltip(null);
      });

      map.on("click", (e) => {
        // Click outside district -> close panel (only when in Maharashtra view)
        const m = mapRef.current;
        if (!m || viewMode !== "maharashtra") return;
        const features = m.queryRenderedFeatures(e.point, { layers: [LAYERS.districtsFill] });
        if (!features?.length) {
          isSindhudurgLocked.current = false; // Release the lock
          onDistrictClear();
        }
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
    // INTERCEPTOR: STOP if Sindhudurg is locked.
    if (isSindhudurgLocked.current) return;
    if (viewMode !== "maharashtra") return;
    if (!m.getLayer(LAYERS.districtsFill)) return;
    m.setPaintProperty(
      LAYERS.districtsFill,
      "fill-color",
      overlayExpression(overlay) as unknown as ExpressionSpecification,
    );
  }, [overlay, viewMode]);

  // Update taluka colors when overlay changes in Sindhudurg view
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    // ENFORCER: Only run if we're explicitly in Sindhudurg mode
    if (!isSindhudurgLocked.current) return; // Skip if Sindhudurg is not locked
    if (viewMode !== "sindhudurg") return;
    
    // For Sindhudurg, update circle markers instead of polygons
    if (!m.getLayer(LAYERS.talukasCircle)) return;
    
    let colorExpression: ExpressionSpecification;
    
    switch (overlay) {
      case "rainfall":
        colorExpression = [
          "interpolate",
          ["linear"],
          ["get", "rainfall_90d"],
          1000, "#fef08a",
          1150, "#a7f3d0",
          1250, "#6ee7b7",
          1350, "#34d399",
        ] as unknown as ExpressionSpecification;
        break;
      case "temperature":
        colorExpression = [
          "interpolate",
          ["linear"],
          ["get", "avg_temp"],
          25, "#bae6fd",
          26, "#a7f3d0",
          27, "#fef08a",
          28, "#fecaca",
        ] as unknown as ExpressionSpecification;
        break;
      case "fertility":
        colorExpression = [
          "interpolate",
          ["linear"],
          ["get", "fertility_score"],
          0, "#fed7aa",
          70, "#fef08a",
          80, "#a7f3d0",
          85, "#bbf7d0",
          100, "#6ee7b7",
        ] as unknown as ExpressionSpecification;
        break;
      case "climate":
        colorExpression = [
          "interpolate",
          ["linear"],
          ["get", "climate_risk_score"],
          0, "#a7f3d0",
          12, "#fef08a",
          18, "#fed7aa",
          25, "#fecaca",
          100, "#ef4444",
        ] as unknown as ExpressionSpecification;
        break;
      case "suitability":
        colorExpression = [
          "interpolate",
          ["linear"],
          ["get", "suitability_score"],
          0, "#fecaca",
          80, "#fef08a",
          84, "#a7f3d0",
          87, "#6ee7b7",
          100, "#34d399",
        ] as unknown as ExpressionSpecification;
        break;
      default:
        colorExpression = [
          "interpolate",
          ["linear"],
          ["get", "rainfall_90d"],
          1000, "#fef08a",
          1150, "#a7f3d0",
          1250, "#6ee7b7",
          1350, "#34d399",
        ] as unknown as ExpressionSpecification;
    }
    
    m.setPaintProperty(LAYERS.talukasCircle, "circle-color", colorExpression);
  }, [overlay, viewMode]);

  // Toggle states fill layer visibility and color based on overlay selection
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    // INTERCEPTOR: STOP if Sindhudurg is locked.
    if (isSindhudurgLocked.current) return;
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
            {viewMode === "india" && "India overview"}
            {viewMode === "maharashtra" && "Maharashtra districts"}
            {viewMode === "sindhudurg" && "Sindhudurg • Taluka Analysis"}
            {viewMode === "taluka" && `${currentTaluka?.name || "Taluka"} • Village Exploration`}
            {viewMode === "village" && "Village • Land Patch Analysis"}
          </div>
          <div className="mt-1 text-sm text-zinc-50">
            {viewMode === "india" && "Select an overlay above to visualize rainfall, soil fertility, or climate risk data across Indian states."}
            {viewMode === "maharashtra" && "District-level attributes drive overlays. Hover for details; click Sindhudurg for deep analysis."}
            {viewMode === "sindhudurg" && "Blue dots = Talukas (zoom 10-12). Green dots = Villages (zoom 13+). Click any marker for details. Zoom out below 9 to return to Maharashtra."}
            {viewMode === "taluka" && "Village labels appear as you zoom closer. Click any village name to explore land patches."}
            {viewMode === "village" && "Land-patch-level view for detailed environmental analysis and reforestation planning."}
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

          {(viewMode === "sindhudurg" || viewMode === "taluka") && (
            <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-zinc-100/90">
              <div className="font-semibold text-blue-300">
                {viewMode === "sindhudurg" ? "🎯 Level of Detail (LOD) System" : "🔍 Village Zoom Mode"}
              </div>
              <div className="mt-1.5 space-y-1">
                {viewMode === "sindhudurg" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>Blue dots (zoom 10-12): Taluka centers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Green dots (zoom 13+): Villages appear</span>
                    </div>
                    <div className="mt-2 text-blue-200/80">
                      💡 Zoom out below level 9 to auto-return to Maharashtra
                    </div>
                  </>
                ) : (
                  "Village labels visible. Click to zoom to land-level detail. Zoom out (<13) to return to taluka view."
                )}
              </div>
            </div>
          )}

          {viewMode === "village" && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-zinc-100/90">
              <div className="font-semibold text-emerald-300">Land Exploration Mode</div>
              <div className="mt-1">
                Village-level land analysis active. Environmental data available for detailed reforestation planning. Zoom out to return to village view.
              </div>
            </div>
          )}

          {viewMode !== "sindhudurg" && viewMode !== "taluka" && viewMode !== "village" && (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-100/80">
              <div className="font-semibold text-zinc-50">Navigation</div>
              <div className="mt-1">
                {viewMode === "india" && "Click Maharashtra to zoom into districts. Click any district for details."}
                {viewMode === "maharashtra" && "Click Sindhudurg district to access in-depth land patch analysis for reforestation planning."}
              </div>
            </div>
          )}
        </div>
      </div>

      <Tooltip data={tooltip} />
    </div>
  );
}

