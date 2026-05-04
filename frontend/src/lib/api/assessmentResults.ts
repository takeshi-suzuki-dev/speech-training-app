import { getOrCreateClientId } from "@/lib/clientId";

export type TrainingAttemptResult = {
  id: string;
  clientId: string;
  userId: string | null;
  mode: string;
  sentenceId: string | null;
  referenceText: string;
  recognizedText: string | null;
  overallScore: number | null;
  accuracyScore: number | null;
  fluencyScore: number | null;
  completenessScore: number | null;
  prosodyScore: number | null;
  wordsJson: string | null;
  audioDurationMs: number | null;
  scoredAt: string;
  createdAt: string;
};

export async function fetchAssessmentResults(
  limit = 50,
): Promise<TrainingAttemptResult[]> {
  const clientId = getOrCreateClientId();

  const response = await fetch(
    `http://localhost:8080/api/training-attempts?clientId=${clientId}&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch assessment results: ${response.status}`);
  }

  return response.json();
}
