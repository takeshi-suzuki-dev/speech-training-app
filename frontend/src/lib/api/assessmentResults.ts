import { API_BASE_URL } from "@/lib/config";
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

export type DailyScoreTrendResult = {
  practiceDate: string;
  overallAverage: number | null;
  accuracyAverage: number | null;
  fluencyAverage: number | null;
  completenessAverage: number | null;
  prosodyAverage: number | null;
  overallMovingAverage5Days: number | null;
  overallMovingAverage20Days: number | null;
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

export async function fetchDailyScoreTrends(): Promise<
  DailyScoreTrendResult[]
> {
  const clientId = getOrCreateClientId();

  const response = await fetch(
    `${API_BASE_URL}/api/training-attempts/history-trends?clientId=${clientId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch daily score trends: ${response.status}`);
  }

  return response.json();
}
