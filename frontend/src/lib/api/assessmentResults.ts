import { z } from "zod";

import { apiFetch } from "@/lib/api/apiFetch";
import { parseJsonResponse } from "@/lib/api/parseResponse";

const trainingAttemptResultSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  mode: z.string(),
  sentenceId: z.string().nullable(),
  referenceText: z.string(),
  recognizedText: z.string().nullable(),
  overallScore: z.number().nullable(),
  accuracyScore: z.number().nullable(),
  fluencyScore: z.number().nullable(),
  completenessScore: z.number().nullable(),
  prosodyScore: z.number().nullable(),
  wordsJson: z.string().nullable(),
  audioDurationMs: z.number().nullable(),
  scoredAt: z.string(),
  createdAt: z.string(),
});

const dailyScoreTrendResultSchema = z.object({
  practiceDate: z.string(),
  overallAverage: z.number().nullable(),
  accuracyAverage: z.number().nullable(),
  fluencyAverage: z.number().nullable(),
  completenessAverage: z.number().nullable(),
  prosodyAverage: z.number().nullable(),
  overallMovingAverage5Days: z.number().nullable(),
  overallMovingAverage20Days: z.number().nullable(),
});

export type TrainingAttemptResult = z.infer<typeof trainingAttemptResultSchema>;
export type DailyScoreTrendResult = z.infer<typeof dailyScoreTrendResultSchema>;

export async function fetchLatestAssessmentResultsBySentence(): Promise<
  TrainingAttemptResult[]
> {
  const response = await apiFetch("/api/sentence-latest-scores");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest assessment results by sentence: ${response.status}`,
    );
  }

  return parseJsonResponse(
    response,
    z.array(trainingAttemptResultSchema),
    "Failed to read latest assessment results",
  );
}

export async function fetchDailyScoreTrends(): Promise<
  DailyScoreTrendResult[]
> {
  const response = await apiFetch("/api/training-attempts/history-trends");

  if (!response.ok) {
    throw new Error(`Failed to fetch daily score trends: ${response.status}`);
  }

  return parseJsonResponse(
    response,
    z.array(dailyScoreTrendResultSchema),
    "Failed to read daily score trends",
  );
}
