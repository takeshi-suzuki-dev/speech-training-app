import { z } from "zod";

// Schemas are the single source of truth: the types below are inferred from
// them, so a field cannot drift between what is validated and what is typed.
//
// Nullability here mirrors PronunciationService.mapAzureResponse: when Azure
// returns no NBest entry (silence, unintelligible audio) the mapper returns
// early, leaving everything except recognitionStatus and rawJson unset.

const scoreMapSchema = z.record(z.string(), z.unknown());

export const sentenceScoresSchema = z.object({
  accuracy: z.number(),
  fluency: z.number(),
  completeness: z.number(),
  prosody: z.number(),
  /** Azure's PronScore, surfaced as the headline number in the UI. */
  overallScore: z.number(),
  // Never populated by the mapper today, so Jackson emits null.
  additionalScores: scoreMapSchema.nullish(),
});

export const wordResultSchema = z.object({
  word: z.string(),
  scores: scoreMapSchema,
  errorType: z.string(),
  // Azure omits timings on some word entries.
  offset: z.number().nullable(),
  duration: z.number().nullable(),
});

export const phonemeResultSchema = z.object({
  word: z.string(),
  phoneme: z.string(),
  scores: scoreMapSchema,
  expectedIpa: z.string(),
  candidates: z.array(z.string()),
  offset: z.number().nullable(),
  duration: z.number().nullable(),
});

export const speechEvaluateResponseSchema = z.object({
  transcript: z.string().nullable(),
  recognitionStatus: z.string().nullable(),
  sentenceScores: sentenceScoresSchema.nullable(),
  words: z.array(wordResultSchema).nullable(),
  phonemes: z.array(phonemeResultSchema).nullable(),
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
