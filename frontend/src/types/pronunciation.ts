import { z } from "zod";

const scoreMapSchema = z.record(z.string(), z.unknown());

export const sentenceScoresSchema = z.object({
  accuracy: z.number(),
  fluency: z.number(),
  completeness: z.number(),
  prosody: z.number(),
  pron: z.number(),
  additionalScores: scoreMapSchema.optional(),
});

export const wordResultSchema = z.object({
  word: z.string(),
  scores: scoreMapSchema,
  errorType: z.string(),
  offset: z.number(),
  duration: z.number(),
});

export const phonemeResultSchema = z.object({
  word: z.string(),
  phoneme: z.string(),
  scores: scoreMapSchema,
  expectedIpa: z.string(),
  candidates: z.array(z.string()),
  offset: z.number(),
  duration: z.number(),
});

export const speechEvaluateResponseSchema = z.object({
  transcript: z.string(),
  recognitionStatus: z.string(),
  overallScore: z.number(),
  sentenceScores: sentenceScoresSchema,
  words: z.array(wordResultSchema),
  phonemes: z.array(phonemeResultSchema),
  // Azure's untouched payload, kept for debugging. Its shape is Azure's to
  // change, so it is deliberately not validated.
  rawJson: z.unknown(),
});

export type SentenceScores = z.infer<typeof sentenceScoresSchema>;
export type WordResult = z.infer<typeof wordResultSchema>;
export type PhonemeResult = z.infer<typeof phonemeResultSchema>;
export type SpeechEvaluateResponse = z.infer<
  typeof speechEvaluateResponseSchema
>;
