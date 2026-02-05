# Suggestion Model

One-time trained suggestion model that produces two JSON lookup tables from `data/finalProcessed.csv` and `data/treesprocessed.csv`:

- **best_saplings_for_regions.json** – For each region (city + lat/lon), the **top 5 saplings** (species) best suited to that region.
- **best_regions_for_saplings.json** – For each sapling (species), the **top 5 regions** best suited for that sapling.

Compatibility uses **weather** (rainfall, temperature), **soil** (pH, texture, organic carbon, nitrogen), and **species requirements** from the trees dataset. Scores are in the range **1–100** (no 0 or misleading values); each list has exactly **5** entries.

## Regenerating the JSONs

From project root:

```bash
python suggestionModel/generate_suggestions.py
```

## Usage in app

- **User selects a region** → Load `best_saplings_for_regions.json`, look up the region key `"City (lat, lon)"`, show the top 5 saplings and their `compatibility_score`.
- **User selects a sapling** → Load `best_regions_for_saplings.json`, look up the species name, show the top 5 regions with `region`, `latitude`, `longitude`, and `compatibility_score`.

Planting date can be used later by filtering or re-ranking with date-specific weather (e.g. by month) if you add per-month region profiles.
