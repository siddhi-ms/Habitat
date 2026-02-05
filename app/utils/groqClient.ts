// Server-side Groq client helper
// Uses `GROQ_API_URL` and `GROQ_API_KEY` from environment when available.
type GroqResponse = any;

export async function runGroqRequest(queryType: string, params?: any): Promise<GroqResponse | null> {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // No API key — cannot make live queries
      return null;
    }

    // Default base URL when not provided
    const apiUrl = process.env.GROQ_API_URL || "https://api.groq.ai/v1";

    const body = { type: queryType, params };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn("Groq request failed", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("Groq request error", err);
    return null;
  }
}
