export type SentenceCategory = {
  id: string;
  categoryKey: string;
  displayName: string;
  description: string | null;
  sortOrder: number;
};

export type SentenceTemplate = {
  id: string;
  categoryId: string;
  templateKey: string | null;
  title: string;
  displayText: string;
  scoringText: string;
  sampleAudioText: string;
  difficulty: string;
  sortOrder: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchSentenceCategories(): Promise<SentenceCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/sentence-categories`);

  if (!response.ok) {
    throw new Error("Failed to fetch sentence categories.");
  }

  return response.json();
}

export async function fetchSentenceTemplates(
  categoryId: string,
): Promise<SentenceTemplate[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/sentence-templates?categoryId=${categoryId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sentence templates.");
  }

  return response.json();
}
