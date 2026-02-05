"use client";
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPicker() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [altitude, setAltitude] = useState<string>("Not selected");
  const [tree, setTree] = useState("Neem");
  const [isDeploying, setIsDeploying] = useState(false);
  const [suggestedSaplings, setSuggestedSaplings] = useState<{ species: string; compatibility_score: number }[]>([]);
  const [suggestedLocations, setSuggestedLocations] = useState<{ region: string; latitude: number; longitude: number; compatibility_score: number }[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const treeList = ["Neem", "Banyan", "Peepal", "Teak", "Sal", "Arjun", "Amla", "Bamboo", "Jamun", "Mango"];

  // Logic to save to Supabase
  const handleDeploy = async () => {
    if (!projectName || !coord) return;
    setIsDeploying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coord.lat,
          longitude: coord.lng,
          sapling_type: tree,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText || "Prediction failed");
      }
      const predictionResult = await res.json();

      const { data, error } = await supabase
        .from("projects")
        .insert([{
          name: projectName,
          lat: coord.lat,
          lng: coord.lng,
          altitude: altitude,
          species: tree,
          user_id: user.id,
          status: "Active",
          survival_rate: "100%",
          prediction_result: predictionResult,
        }])
        .select();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const projectId = data?.[0]?.id;
      if (!projectId) throw new Error("No project ID returned");
      router.push(`/project/${projectId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deployment failed";
      alert(message);
    } finally {
      setIsDeploying(false);
    }
  };

  const fetchSuggestedSaplings = useCallback(async () => {
    if (!coord) return;
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suggestions/saplings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: coord.lat, longitude: coord.lng }),
      });
      const data = await res.json();
      setSuggestedSaplings(data.saplings || []);
    } catch {
      setSuggestedSaplings([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [coord]);

  const fetchSuggestedLocations = useCallback(async () => {
    if (!tree) return;
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suggestions/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ species: tree }),
      });
      const data = await res.json();
      setSuggestedLocations(data.locations || []);
    } catch {
      setSuggestedLocations([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [tree]);

  useEffect(() => {
    if (coord) fetchSuggestedSaplings();
    else setSuggestedSaplings([]);
  }, [coord, fetchSuggestedSaplings]);

  useEffect(() => {
    if (tree) fetchSuggestedLocations();
    else setSuggestedLocations([]);
  }, [tree, fetchSuggestedLocations]);

  function LocationMarker() {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        setCoord({ lat, lng });
        setAltitude("Fetching...");
        try {
          const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
          const data = await res.json();
          setAltitude(`${data.results[0].elevation} meters`);
        } catch {
          setAltitude("Data Unavailable");
        }
      },
    });
    return coord ? <Marker position={coord} icon={customIcon} /> : null;
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-white text-slate-900">
      {/* Map Section */}
      <div className="flex-[3] relative z-0 border-r border-gray-200">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
        </MapContainer>
      </div>

      {/* Right Column */}
      <div className="flex-1 p-8 flex flex-col gap-6 bg-white overflow-y-auto shadow-2xl z-10">
        <header className="border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">New Restoration Site</h2>
          <p className="text-sm text-gray-600 mt-1">Fill in the site details to begin monitoring.</p>
        </header>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">Project Name</label>
            <input
              type="text"
              placeholder="e.g. Western Ghats Phase 1"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="p-4 bg-gray-900 rounded-xl shadow-inner border border-gray-800">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Coordinates</span>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs font-mono">LATITUDE</span>
                <span className="text-white font-mono font-bold text-lg">{coord?.lat.toFixed(6) || "0.000000"}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-800 pt-2">
                <span className="text-gray-400 text-xs font-mono">LONGITUDE</span>
                <span className="text-white font-mono font-bold text-lg">{coord?.lng.toFixed(6) || "0.000000"}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Ground Altitude</span>
            <p className="mt-1 text-2xl font-black text-emerald-900">{altitude}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">Primary Sampling Species</label>
            <select
              value={tree}
              onChange={(e) => setTree(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 text-gray-900 outline-none appearance-none"
            >
              {treeList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {suggestedSaplings.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Suggested for this location</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {suggestedSaplings.slice(0, 5).map((s) => (
                    <button
                      key={s.species}
                      type="button"
                      onClick={() => setTree(s.species)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tree === s.species ? "bg-emerald-600 text-white shadow" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
                    >
                      {s.species} ({s.compatibility_score}%)
                    </button>
                  ))}
                </div>
              </div>
            )}
            {suggestionsLoading && suggestedSaplings.length === 0 && coord && (
              <p className="text-xs text-gray-500 mt-1">Loading suggestions...</p>
            )}
          </div>

          {suggestedLocations.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Suggested regions for {tree}</span>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {suggestedLocations.slice(0, 5).map((loc) => (
                  <li key={`${loc.region}-${loc.latitude}`} className="flex justify-between items-center">
                    <span className="font-medium">{loc.region}</span>
                    <span className="text-emerald-600 font-bold">{loc.compatibility_score}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={handleDeploy}
          disabled={!projectName || !coord || isDeploying}
          className="mt-auto w-full py-4 bg-[#00a86b] hover:bg-[#008f5a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl shadow-[0_4px_14px_0_rgba(0,168,107,0.39)] transition-all active:scale-95"
        >
          {isDeploying ? "SYNCING DATA..." : "DEPLOY PROJECT"}
        </button>
      </div>
    </div>
  );
}