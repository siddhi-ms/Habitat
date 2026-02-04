"use client";

import { useState, useRef, useEffect } from "react";

export type SearchLocation = {
  name: string;
  center: [number, number];
  zoom: number;
  type: "district" | "city" | "taluka" | "village";
};

// Location database focused on Sindhudurg district with full hierarchy
const SEARCH_LOCATIONS: SearchLocation[] = [
  // Sindhudurg District
  { name: "Sindhudurg", center: [73.6, 16.05], zoom: 10.8, type: "district" },
  { name: "Sindhudurg District", center: [73.6, 16.05], zoom: 10.8, type: "district" },
  
  // Talukas in Sindhudurg (6 administrative divisions)
  { name: "Kudal", center: [73.69, 15.99], zoom: 13.5, type: "taluka" },
  { name: "Kudal Taluka", center: [73.69, 15.99], zoom: 13.5, type: "taluka" },
  { name: "Sawantwadi", center: [73.82, 15.90], zoom: 13.5, type: "taluka" },
  { name: "Sawantwadi Taluka", center: [73.82, 15.90], zoom: 13.5, type: "taluka" },
  { name: "Malwan", center: [73.46, 16.06], zoom: 13.5, type: "taluka" },
  { name: "Malwan Taluka", center: [73.46, 16.06], zoom: 13.5, type: "taluka" },
  { name: "Vengurla", center: [73.62, 15.86], zoom: 13.5, type: "taluka" },
  { name: "Vengurla Taluka", center: [73.62, 15.86], zoom: 13.5, type: "taluka" },
  { name: "Devgad", center: [73.38, 16.37], zoom: 13.5, type: "taluka" },
  { name: "Devgad Taluka", center: [73.38, 16.37], zoom: 13.5, type: "taluka" },
  { name: "Kankavli", center: [73.70, 16.27], zoom: 13.5, type: "taluka" },
  { name: "Kankavli Taluka", center: [73.70, 16.27], zoom: 13.5, type: "taluka" },
  
  // Villages in Kudal Taluka
  { name: "Achara", center: [73.66, 16.02], zoom: 15, type: "village" },
  { name: "Bambuli", center: [73.73, 15.95], zoom: 15, type: "village" },
  
  // Villages in Sawantwadi Taluka
  { name: "Adeli", center: [73.78, 15.84], zoom: 15, type: "village" },
  { name: "Naneli", center: [73.86, 15.96], zoom: 15, type: "village" },
  
  // Villages in Malwan Taluka
  { name: "Tondavali", center: [73.42, 16.10], zoom: 15, type: "village" },
  { name: "Juva", center: [73.51, 16.02], zoom: 15, type: "village" },
  
  // Villages in Vengurla Taluka
  { name: "Mochemad", center: [73.58, 15.80], zoom: 15, type: "village" },
  { name: "Redi", center: [73.68, 15.92], zoom: 15, type: "village" },
  
  // Villages in Devgad Taluka
  { name: "Vijaydurg", center: [73.33, 16.30], zoom: 15, type: "village" },
  { name: "Kochara", center: [73.43, 16.42], zoom: 15, type: "village" },
  
  // Villages in Kankavli Taluka
  { name: "Vaibhavvadi", center: [73.66, 16.33], zoom: 15, type: "village" },
  { name: "Phanasgaon", center: [73.75, 16.21], zoom: 15, type: "village" },
];

export function SearchBar({
  onLocationSelect,
}: {
  onLocationSelect: (location: SearchLocation) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = SEARCH_LOCATIONS.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleSelect = (location: SearchLocation) => {
    setQuery(location.name);
    setShowSuggestions(false);
    onLocationSelect(location);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setSuggestions(suggestions)}
          placeholder="Search Sindhudurg: talukas, villages..."
          className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-sm transition-all focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          suppressHydrationWarning
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-white/20 bg-black/90 shadow-2xl backdrop-blur-md">
          {suggestions.map((location, idx) => (
            <button
              key={`${location.name}-${idx}`}
              onClick={() => handleSelect(location)}
              className="w-full border-b border-white/10 px-4 py-3 text-left transition-colors hover:bg-emerald-500/20 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  {location.type === "district" ? (
                    <svg
                      className="h-4 w-4 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  ) : location.type === "taluka" ? (
                    <svg
                      className="h-4 w-4 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {location.name}
                  </div>
                  <div className="text-xs text-white/60">
                    {location.type === "district" ? "District" : location.type === "taluka" ? "Taluka" : "City"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-white/20 bg-black/90 px-4 py-3 text-sm text-white/60 backdrop-blur-md">
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
