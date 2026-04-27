import { getOrCreateClientId } from "@/lib/clientId";

export async function fetchAssetmentResults() {
  const clientId = getOrCreateClientId();

  const response = await fetch(
    `http://localhost:8080/api/training-attempts?clientId=${clientId}&limit=20`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch assessment results: ${response.status}`);
  }

  return response.json;
}
