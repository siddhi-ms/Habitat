# Habitat - City-Level Land Analysis Dashboard

## 🎯 Overview

This project has been transformed into a **focused, city-level land analysis tool** for **Sindhudurg district** in Maharashtra, India. The system provides **deep environmental analysis at the land-patch level** to support reforestation planning decisions without tree species recommendation.

---

## 🗺️ Features

### 1. **Multi-Level Navigation**
- **India View** → **Maharashtra Districts** → **Sindhudurg Land Patches**
- Smooth, cinematic zoom transitions between levels
- Clear visual hierarchy with contextual information panels

### 2. **Land Patch Grid System**
- Sindhudurg divided into **100 land patches** (10x10 grid)
- Each patch contains detailed environmental metrics:
  - **Rainfall** (30-day & 90-day aggregates)
  - **Temperature** & heat stress indicators
  - **Soil properties** (carbon, nitrogen, pH, fertility)
  - **Climate risk** (drought index & overall risk score)
  - **Suitability score** (0-100 for reforestation planning)

### 3. **Environmental Layer Toggles**
Interactive visualization layers:
- 🌧️ **Rainfall** - 90-day accumulation with adequacy indicators
- 🌡️ **Temperature** - Average temperature with stress mapping
- 🧪 **Soil Fertility** - Derived from carbon & nitrogen content
- 🔥 **Climate Risk** - Drought & heat stress composite
- ✓ **Suitability** - Overall land viability score

### 4. **Place Search**
Search functionality for:
- **Districts**: Sindhudurg, Ratnagiri, Kolhapur
- **Cities/Talukas**: Kudal, Sawantwadi, Malwan, Vengurla, Devgad, Kankavli, Dodamarg, Vaibhavwadi
- Auto-zoom to searched location

### 5. **Detailed Patch Analysis**
Click any land patch to view:
- Overall suitability score with color-coded rating
- Rainfall metrics (30d & 90d)
- Temperature & heat stress
- Comprehensive soil analysis
- Climate risk assessment
- Actionable summary insights

---

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Mapping**: MapLibre GL (open-source alternative to Mapbox)
- **Styling**: Tailwind CSS
- **Data**: Static GeoJSON with realistic environmental data

### **Key Components**

#### `/app/live/`
- **`MapContainer.tsx`** - Core map implementation with 3-tier view system
- **`SearchBar.tsx`** - Location search with autocomplete
- **`LayerToggle.tsx`** - Environmental layer selector
- **`PatchInfoPanel.tsx`** - Detailed land patch analysis panel
- **`DistrictInfoPanel.tsx`** - District-level summary panel
- **`sindhudurgData.ts`** - Land patch grid generation & color scales
- **`geo.ts`** - India states & Maharashtra districts GeoJSON
- **`scoring.ts`** - Environmental suitability calculation logic

---

## 📊 Data Model

### **Land Patch Properties**
```typescript
type LandPatch = {
  id: string;                    // Unique identifier (SD-001 to SD-100)
  center: [number, number];      // [longitude, latitude]
  rainfall_30d: number;          // mm
  rainfall_90d: number;          // mm
  avg_temp: number;              // °C
  soil_carbon: number;           // %
  soil_nitrogen: number;         // %
  soil_ph: number;               // pH value
  drought_index: number;         // 0-100 (higher = more risk)
  heat_stress: number;           // 0-100 (higher = more stress)
  fertility_score: number;       // 0-100
  climate_risk_score: number;    // 0-100
  suitability_score: number;     // 0-100 (overall viability)
}
```

### **Environmental Calculation Logic**

#### Rainfall Adequacy
- Based on 90-day accumulation
- Coastal areas receive higher rainfall (gradient effect)
- Threshold-based adequacy scoring

#### Soil Fertility
```
fertility_score = (soil_carbon / 3.5) * 50 + (soil_nitrogen / 0.25) * 50
```

#### Climate Risk
```
climate_risk_score = (drought_index * 0.6) + (heat_stress * 0.4)
```

#### Overall Suitability
```
suitability_score = 
  fertility_score * 0.4 +
  (100 - climate_risk_score) * 0.3 +
  (rainfall_90d / 1400) * 100 * 0.3
```

---

## 🎮 User Flow

### **Step-by-Step Navigation**

1. **Start at India View**
   - See Maharashtra highlighted among Indian states
   - Select overlay to visualize environmental data
   - Click Maharashtra or zoom in

2. **Maharashtra Districts View**
   - See all districts with environmental overlays
   - Hover for district summaries
   - Click **Sindhudurg** for land-level analysis

3. **Sindhudurg Land Patches View**
   - **100 land patches** displayed as grid
   - Toggle between environmental layers
   - Hover patches for quick stats
   - Click patch for detailed analysis panel

4. **Search Alternative**
   - Type location name in search bar
   - Select from autocomplete suggestions
   - Auto-zoom to selected location

---

## 🎨 Visual Design

### **Color Scales** (Colorblind-Safe)

#### Rainfall
- < 600mm: `#fef08a` (yellow)
- 600-900mm: `#a7f3d0` (green)
- 900-1200mm: `#6ee7b7` (teal)
- > 1200mm: `#34d399` (deep green)

#### Temperature
- < 24°C: `#bae6fd` (cool blue)
- 24-27°C: `#a7f3d0` (comfortable green)
- 27-30°C: `#fef08a` (warm yellow)
- > 30°C: `#fecaca` (hot red)

#### Soil Fertility
- 0-40: `#fed7aa` (low - orange)
- 40-65: `#fef08a` (medium - yellow)
- 65-80: `#a7f3d0` (good - green)
- 80-100: `#bbf7d0` (high - bright green)

#### Climate Risk (Inverted Scale)
- 0-25: `#a7f3d0` (low - green)
- 25-50: `#fef08a` (moderate - yellow)
- 50-70: `#fed7aa` (elevated - orange)
- 70-100: `#fecaca` (high - red)

### **UI Themes**
- Dark mode optimized for map viewing
- Glass-morphism panels with backdrop blur
- Smooth transitions and hover states
- Responsive design (desktop-first, mobile-friendly)

---

## 📁 File Structure

```
app/
├── live/
│   ├── page.tsx                    # Main page orchestrator
│   ├── MapContainer.tsx            # Core map with 3-tier navigation
│   ├── SearchBar.tsx               # Location search component
│   ├── LayerToggle.tsx             # Environmental layer selector
│   ├── PatchInfoPanel.tsx          # Land patch detail panel
│   ├── DistrictInfoPanel.tsx       # District summary panel
│   ├── Tooltip.tsx                 # Hover tooltip
│   ├── sindhudurgData.ts           # Patch data & color scales
│   ├── geo.ts                      # GeoJSON data (states/districts)
│   └── scoring.ts                  # Suitability calculation logic
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000/live
```

---

## 🎯 Scope Decisions

### ✅ **Included**
- Rainfall analysis (30d & 90d)
- Climate risk indicators (drought, heat stress)
- Soil fertility mapping
- Temperature stress visualization
- Land patch suitability scoring
- Multi-level navigation (India → Maharashtra → Sindhudurg)
- Place search functionality
- Interactive environmental layers

### ❌ **Removed** (Per Mentor Guidance)
- Tree species recommendation
- Plant matching algorithms
- Lifecycle simulation
- Growth prediction models

---

## 💡 Key Implementation Highlights

### **1. Grid Generation Algorithm**
- Divides Sindhudurg into uniform 10x10 grid
- Applies coastal gradient for rainfall
- Elevation proxy for temperature variation
- Realistic soil composition (laterite-based)

### **2. MapLibre Integration**
- Three-source architecture (states, districts, patches)
- Dynamic layer visibility based on view mode
- Expression-based color mapping
- Smooth camera transitions with easing

### **3. Interactive Layers**
- Real-time color expression updates
- Conditional rendering based on view mode
- Hover effects with patch highlighting
- Click handlers for drill-down navigation

### **4. Search Functionality**
- Fuzzy string matching for location names
- Type-ahead autocomplete
- Click-outside-to-close behavior
- Visual distinction between districts and cities

---

## 🎓 Judge Pitch (60 seconds)

> "Our system transforms raw environmental data into actionable land analysis for Sindhudurg. Start at India level, zoom into Maharashtra's districts, then drill down to Sindhudurg where we've divided the region into 100 land patches. Each patch shows rainfall adequacy, soil fertility, temperature stress, and climate risk. Toggle between environmental layers to identify which specific areas are viable for reforestation. Click any patch to see detailed metrics including soil carbon, nitrogen, pH, drought index, and an overall suitability score. This gives stakeholders precise, patch-level insights to make informed planning decisions without needing external GIS tools."

---

## 📝 Future Enhancements (Optional)

1. **Real API Integration**
   - Connect to actual soil/weather APIs
   - Live rainfall data from IMD
   - Satellite-based vegetation indices

2. **Additional Districts**
   - Expand beyond Sindhudurg
   - Ratnagiri, Kolhapur deep analysis
   - Comparative district analysis

3. **Export Functionality**
   - PDF reports for selected patches
   - CSV export of environmental data
   - GeoJSON download for GIS tools

4. **User Annotations**
   - Mark patches for planning
   - Add custom notes/tags
   - Save analysis sessions

---

## 🙏 Acknowledgments

- **MapLibre** for open-source mapping
- **Next.js** team for the excellent framework
- **Tailwind CSS** for rapid styling
- **Esri** for satellite imagery tiles

---

## 📜 License

This project is for educational/demonstration purposes.

---

**Built with precision for government-grade environmental planning** 🌳
