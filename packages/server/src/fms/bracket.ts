import type { BracketData } from "lib";

export async function fetchBracket(fmsUrl: string): Promise<BracketData | null> {
  try {
    const res = await fetch(
      `http://${fmsUrl}/api/v1.0/audience_gs/get/GetBracketData`
    );
    if (!res.ok) {
      console.warn(`GetBracketData returned ${res.status}`);
      return null;
    }
    return (await res.json()) as BracketData;
  } catch (err) {
    console.warn("GetBracketData fetch failed", err);
    return null;
  }
}
