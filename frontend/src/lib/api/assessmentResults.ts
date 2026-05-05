import { API_BASE_URL } from "@/lib/config/config";
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

export async function fetchLatestAssessmentResultsBySentence(): Promise<
  TrainingAttemptResult[]
> {
  const clientId = getOrCreateClientId();

  const response = await fetch(
    `${API_BASE_URL}/api/sentence-latest-scores?clientId=${clientId}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest assessment results by sentence: ${response.status}`,
    );
  }

  return response.json();
}
