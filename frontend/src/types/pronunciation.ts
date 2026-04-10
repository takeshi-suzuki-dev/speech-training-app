export type SentenceScores = {
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  additionalScores?: Record<string, unknown>;
};

export type WordResult = {
  word: string;
  scores: Record<string, unknown>;
  errorType: string;
  offset: number;
  duration: number;
};

export type PhonemeResult = {
  word: string;
  phoneme: string;
  scores: Record<string, unknown>;
  expectedIpa: string;
  candidates: string[];
  offset: number;
  duration: number;
};

export type SpeechEvaluateResponse = {
  transcript: string;
  overallScore: number;
  sentenceScores: SentenceScores;
  words: WordResult[];
  phonemes: PhonemeResult[];
  extras: Record<string, unknown>;
  rawJson: unknown;
};
