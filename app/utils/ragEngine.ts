import speciesProtocols from '@/app/data/species_protocol.json';


export function generateCareProtocol(speciesKey: string, altitude: number, lat: number) {
  // 1. Normalize the input to lowercase
  let key = speciesKey.toLowerCase().trim();

  // 2. Alias Mapping: Catch differences between UI names and JSON keys
  const aliases: { [key: string]: string } = {
    "arjuna": "arjun",
    "banyan tree": "banyan",
    "indian lilac": "neem"
  };

  if (aliases[key]) {
    key = aliases[key];
  }

  // 3. Retrieval from your JSON
  const baseData = (speciesProtocols as any)[key];

  if (!baseData) {
    console.error(`RAG Engine: Looked for "${key}" but found nothing in JSON.`);
    return { phases: [], video: "" };
  }

  // 4. Augment phases with environmental data
  const augmentedPhases = baseData.phases.map((phase: any) => ({
    ...phase,
    details: altitude > 1000 ? `${phase.details} [High Altitude Note: Ensure extra mulching]` : phase.details
  }));

  return {
    phases: augmentedPhases,
    video: baseData.video || ""
  };
}