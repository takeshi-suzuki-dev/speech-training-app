import { useCallback, useEffect, useRef, useState } from "react";
import { scorePronunciation } from "@/lib/api/pronunciationAssessment";
import { SentenceTemplate } from "@/lib/api/sentenceTemplates";
import { PhonemeResult, SpeechEvaluateResponse } from "@/types/pronunciation";

// ── Params / return ──────────────────────────────────────────
type UseScoringParams = {
  /** Scoring problems (input validation + assessment API failures). */
  reportError: (message: string) => void;
};

type SubmitArgs = {
  /** The captured recording to score. */
  audioFile: File | null;
  /** Fallback reference text used when the template has no scoringText. */
  referenceText: string;
  /** Selected sentence; supplies scoringText + id for the request. */
  template: SentenceTemplate | null;
  /**
   * Called after a successful score so the caller can refresh side data
   * (e.g. the per-template "latest score" badges). Awaited.
   */
  onScored: () => Promise<void> | void;
};

export type Scoring = {
  result: SpeechEvaluateResponse | null;
  loading: boolean;
  scored: boolean;
  /** Index of the word chip whose phoneme detail is expanded (null = none). */
  expandedWord: number | null;
  /**
   * Validate inputs, run the assessment, and store the result. Surfaces
   * validation/API problems through `reportError`; never throws.
   */
  submit: (args: SubmitArgs) => Promise<void>;
  /** Toggle the expanded phoneme detail for a word chip. */
  toggleWord: (index: number) => void;
  /** Phonemes belonging to a word in the current result (case-insensitive). */
  getPhonemesByWord: (word: string) => PhonemeResult[];
  /**
   * Clear result / scored / expandedWord. Call when the current score is no
   * longer relevant — e.g. a new recording starts or the sentence changes.
   * Stable identity (safe as an effect dependency / callback prop).
   */
  reset: () => void;
};

export function useScoring({ reportError }: UseScoringParams): Scoring {
  const [result, setResult] = useState<SpeechEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scored, setScored] = useState(false);
  const [expandedWord, setExpandedWord] = useState<number | null>(null);

  // reportError read through a ref so `submit` doesn't need it as a dependency
  // (avoids re-subscribe churn on parent re-renders). Synced in an effect —
  // never written during render (react-hooks/refs). Same pattern as the other
  // pronunciation hooks.
  const reportErrorRef = useRef(reportError);
  useEffect(() => {
    reportErrorRef.current = reportError;
  });

  // Uses only plain/stable setters, so it's a stable ([]) callback — safe to
  // pass as `onRecordingStart` and to depend on in the template-switch effect.
  const reset = useCallback(() => {
    setResult(null);
    setScored(false);
    setExpandedWord(null);
  }, []);

  const toggleWord = useCallback((index: number) => {
    setExpandedWord((prev) => (prev === index ? null : index));
  }, []);

  const submit = useCallback(
    async ({ audioFile, referenceText, template, onScored }: SubmitArgs) => {
      if (!audioFile) {
        reportErrorRef.current("Please record audio or select an audio file.");
        setResult(null);
        return;
      }
      if (!referenceText.trim()) {
        reportErrorRef.current("Please enter reference text.");
        setResult(null);
        return;
      }

      try {
        setLoading(true);
        reportErrorRef.current("");
        // Score against the natural-contraction text when the template has one;
        // fall back to the displayed reference text otherwise.
        const scoringText = template?.scoringText ?? referenceText;
        const response = await scorePronunciation(
          audioFile,
          scoringText,
          template?.id,
        );
        setResult(response);
        setExpandedWord(null);
        setScored(true);

        await onScored();
      } catch (error) {
        reportErrorRef.current(
          error instanceof Error
            ? error.message
            : "Failed to evaluate pronunciation.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Fresh closure each render so it always reads the latest result; only ever
  // called during render (in the word-scores JSX), so no memoization needed.
  const getPhonemesByWord = (word: string): PhonemeResult[] => {
    if (!result?.phonemes) return [];
    return result.phonemes.filter(
      (p) => p.word?.toLowerCase() === word.toLowerCase(),
    );
  };

  return {
    result,
    loading,
    scored,
    expandedWord,
    submit,
    toggleWord,
    getPhonemesByWord,
    reset,
  };
}
