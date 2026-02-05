import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SCALE_PARAMS_PATH = "python/data/target_scale_params.json";
const TEXTURE_ENCODING_PATH = "python/data/texture_encoding.json";
const RESULTS_DIR = "results";

type ScaleParams = Record<string, { mean: number; std: number }>;

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split("\n").filter((l) => l.trim() !== "");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const entry: Record<string, string> = {};
    headers.forEach((h, i) => {
      entry[h] = values[i]?.trim();
    });
    return entry;
  });
}

function loadScaleParams(): ScaleParams | null {
  try {
    const p = path.join(process.cwd(), SCALE_PARAMS_PATH);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function loadTextureEncoding(): Record<string, string> {
  try {
    const p = path.join(process.cwd(), TEXTURE_ENCODING_PATH);
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return {};
  }
}

function decodeValue(key: string, standardized: number, scaleParams: ScaleParams | null): number {
  if (!scaleParams || !scaleParams[key]) return standardized;
  const { mean, std } = scaleParams[key];
  return standardized * std + mean;
}

/** Aggregate district rows and decode to real-world values using CSV scale params */
function getDistrictAggregate(districtName: string): {
  city: string;
  decoded: Record<string, number>;
  textureName: string;
  lat: number;
  lon: number;
} | null {
  try {
    const csvPath = path.join(process.cwd(), "python/data/finalProcessed.csv");
    if (!fs.existsSync(csvPath)) return null;

    const data = parseCSV(fs.readFileSync(csvPath, "utf-8"));
    const districtEntries = data.filter(
      (row) => row.city?.toLowerCase().trim() === districtName.toLowerCase().trim()
    );

    if (districtEntries.length === 0) {
      const normalized = districtName.toLowerCase().replace(/\s+/g, " ").trim();
      const fuzzy = data.filter((row) =>
        row.city?.toLowerCase().replace(/\s+/g, " ").trim().includes(normalized) ||
        normalized.includes(row.city?.toLowerCase().replace(/\s+/g, " ") ?? "")
      );
      if (fuzzy.length === 0) return null;
      districtEntries.push(...fuzzy);
    }

    const scaleParams = loadScaleParams();
    const textureMap = loadTextureEncoding();

    const numericKeys = [
      "rainfall_weekly", "rainfall_30d", "rainfall_90d", "temp_mean", "temp_max", "temp_min",
      "humidity_mean", "wind_speed", "solar_radiation", "et0", "Depth_cm", "pH",
      "Org_Carbon_pct", "Nitrogen_pct", "Texture_Code_encoded"
    ];

    const sums: Record<string, number> = {};
    const n = districtEntries.length;
    for (const row of districtEntries) {
      for (const key of numericKeys) {
        const v = parseFloat(row[key]);
        if (!Number.isNaN(v)) sums[key] = (sums[key] ?? 0) + v;
      }
    }
    const decoded: Record<string, number> = {};
    for (const key of numericKeys) {
      const avg = (sums[key] ?? 0) / n;
      decoded[key] = decodeValue(key, avg, scaleParams);
    }
    const texEnc = Math.round(decoded.Texture_Code_encoded ?? 0);
    decoded.Texture_Code_encoded = texEnc;
    const textureName = textureMap[String(texEnc)] ?? `Texture ${texEnc}`;

    const first = districtEntries[0];
    return {
      city: first.city ?? districtName,
      decoded,
      textureName,
      lat: parseFloat(first.lat) || 0,
      lon: parseFloat(first.lon) || 0,
    };
  } catch (e) {
    console.error("Error getDistrictAggregate:", e);
    return null;
  }
}

/** Compute suitability sub-scores and overall from real CSV-derived data */
function computeSuitabilityFromData(decoded: Record<string, number>) {
  const rainfall30 = decoded.rainfall_30d ?? 130;
  const rainfall90 = decoded.rainfall_90d ?? 390;
  const tempMax = decoded.temp_max ?? 32;
  const pH = decoded.pH ?? 7.5;
  const carbon = decoded.Org_Carbon_pct ?? 1;
  const nitrogen = decoded.Nitrogen_pct ?? 0.08;
  const humidity = decoded.humidity_mean ?? 64;
  const et0 = decoded.et0 ?? 4.5;

  const rainfallScore = (() => {
    const r = rainfall30;
    if (r <= 0) return 0;
    if (r < 50) return Math.round(r * 0.8);
    if (r < 150) return Math.round(40 + (r - 50));
    if (r < 400) return Math.round(140 + (r - 150) / 5);
    return Math.min(100, Math.round(190 + (r - 400) / 20));
  })();

  const fertilityScore = (() => {
    const phScore = pH >= 6 && pH <= 8.5 ? 100 : pH >= 5 && pH <= 9 ? 70 : 40;
    const nutrientScore = Math.min(100, (carbon / 2) * 40 + (nitrogen / 0.2) * 60);
    return Math.round(phScore * 0.4 + nutrientScore * 0.6);
  })();

  const climateRiskScore = (() => {
    let risk = 0;
    if (tempMax > 38) risk += 30;
    else if (tempMax > 35) risk += 15;
    if (et0 > 6) risk += 25;
    else if (et0 > 5) risk += 10;
    if (humidity > 85) risk += 15;
    return Math.min(100, risk);
  })();
  const climateSuitability = 100 - climateRiskScore;

  const vegetationBaseline = 50;

  const climatePenalty = -Math.min(30, climateRiskScore);

  const suitabilityScore = Math.round(
    rainfallScore * 0.3 +
    fertilityScore * 0.3 +
    climateSuitability * 0.25 +
    vegetationBaseline * 0.15 +
    (climatePenalty * 0.15)
  );
  const finalScore = Math.max(0, Math.min(100, suitabilityScore));

  return {
    suitabilityScore: finalScore,
    rainfallScore: Math.min(100, rainfallScore),
    fertilityScore: Math.min(100, fertilityScore),
    vegetationBaseline,
    climatePenalty,
    climateRiskScore,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, district } = body;

    if (type === "district_intelligence" && district) {
      const agg = getDistrictAggregate(district);

      if (!agg) {
        return NextResponse.json(
          { error: `No data in finalProcessed.csv for district: ${district}` },
          { status: 404 }
        );
      }

      const { decoded, textureName, city } = agg;
      const scores = computeSuitabilityFromData(decoded);

      const rainfall30 = Math.round(decoded.rainfall_30d ?? 0);
      const rainfall90 = Math.round(decoded.rainfall_90d ?? 0);
      const tempMax = (decoded.temp_max ?? 0).toFixed(1);
      const pHVal = (decoded.pH ?? 0).toFixed(2);
      const carbonVal = (decoded.Org_Carbon_pct ?? 0).toFixed(2);
      const nitrogenVal = (decoded.Nitrogen_pct ?? 0).toFixed(3);

      const climateLabel =
        scores.climateRiskScore >= 50 ? "High" : scores.climateRiskScore >= 25 ? "Moderate" : "Low";
      const fertilityLabel =
        scores.fertilityScore >= 70 ? "High" : scores.fertilityScore >= 40 ? "Medium" : "Low";

      const environmentalSummary = [
        `Rainfall: ${rainfall30} mm (30d), ${rainfall90} mm (90d)`,
        `Soil: ${textureName} • Fertility: ${fertilityLabel} (pH ${pHVal}, C ${carbonVal}%, N ${nitrogenVal}%)`,
        `Climate risk: ${climateLabel} (max temp ${tempMax}°C)`,
      ];

      const rationale = [
        { label: "Rainfall sub-score", value: `${scores.rainfallScore}/100` },
        { label: "Fertility factor", value: `${scores.fertilityScore}/100` },
        { label: "Vegetation baseline", value: `${scores.vegetationBaseline}/100` },
        {
          label: "Climate penalty",
          value: `${scores.climatePenalty} (risk score ${scores.climateRiskScore})`,
        },
      ];

      let recommendedStrategy: string[] = [
        "Water conservation and drought mitigation focus",
        "Land preparation with moisture retention techniques",
        "Consider soil amendments in critical zones",
      ];

      const apiKey = process.env.GROQ_API_KEY;
      if (apiKey) {
        try {
          const promptContext = `
District: ${city}
Real data from finalProcessed.csv (Maharashtra):
- Rainfall 30d: ${rainfall30} mm, 90d: ${rainfall90} mm
- Temp max: ${tempMax}°C, pH: ${pHVal}, Organic C: ${carbonVal}%, Nitrogen: ${nitrogenVal}%
- Soil texture: ${textureName}, Climate risk: ${climateLabel}
- Suitability score: ${scores.suitabilityScore}/100
`;
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert agronomist for reforestation in Maharashtra. Return ONLY a JSON object with a single key 'recommendedStrategy' which is an array of exactly 3 short actionable strategy strings (e.g. 'Miyawaki method', 'Drought-resistant native species'). No other text.",
                },
                {
                  role: "user",
                  content: `Based on this real district data, suggest 3 reforestation strategies:\n${promptContext}`,
                },
              ],
              temperature: 0.5,
              response_format: { type: "json_object" },
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const content = json.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed.recommendedStrategy)) {
                recommendedStrategy = parsed.recommendedStrategy.slice(0, 3);
              }
            }
          }
        } catch (e) {
          console.warn("Groq strategy generation failed, using defaults:", e);
        }
      }

      const response = {
        districtName: city,
        environmentalSummary,
        suitabilityScore: scores.suitabilityScore,
        recommendedStrategy,
        rationale,
        rawData: {
          rainfall_30d_mm: rainfall30,
          rainfall_90d_mm: rainfall90,
          temp_max_c: parseFloat(tempMax),
          pH: parseFloat(pHVal),
          Org_Carbon_pct: parseFloat(carbonVal),
          Nitrogen_pct: parseFloat(nitrogenVal),
          texture: textureName,
          climate_risk: climateLabel,
        },
      };

      const resultsDir = path.join(process.cwd(), RESULTS_DIR);
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      const filename = `district_${new Date().toISOString().replace(/[:.]/g, "-")}_${district.replace(/\s+/g, "_")}.json`;
      const filePath = path.join(resultsDir, filename);
      fs.writeFileSync(filePath, JSON.stringify({ timestamp: new Date().toISOString(), district: city, response }, null, 2));
      console.log(`Saved district intelligence to ${filePath}`);

      return NextResponse.json(response);
    }

    const { INDIA_STATES_GEOJSON, MAHARASHTRA_DISTRICTS_GEOJSON } = require("../../live/geo");
    const { getSindhudurgTalukasGeoJSON, getSindhudurgVillagesGeoJSON } = require("../../live/sindhudurgTalukas");

    if (type === "india_states") return NextResponse.json(INDIA_STATES_GEOJSON);
    if (type === "maharashtra_districts") return NextResponse.json(MAHARASHTRA_DISTRICTS_GEOJSON);
    if (type === "sindhudurg_talukas") return NextResponse.json(getSindhudurgTalukasGeoJSON());
    if (type === "sindhudurg_villages") return NextResponse.json(getSindhudurgVillagesGeoJSON());

    return NextResponse.json({ error: "Unknown request type" }, { status: 400 });
  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
