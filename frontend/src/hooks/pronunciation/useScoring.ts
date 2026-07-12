import { useCallback, useEffect, useRef, useState } from "react";
import { scorePronunciation } from "@/lib/api/pronunciationAssessment";
import { SentenceTemplate } from "@/lib/api/sentenceTemplates";
import { PhonemeResult, SpeechEvaluateResponse } from "@/types/pronunciation";

// ── Params / return ──────────────────────────────────────────
type UseScoringParams = {
  reportError: (message: string) => void;
};

/**
 * Everything an assessment run needs. Passed per call rather than at hook init:
 * the recording, the sentence and the score badges are owned by three different
 * hooks, and taking them as arguments keeps this one independent of all three.
 */
type SubmitArgs = {
  audioFile: File | null;
  referenceText: string;
  template: SentenceTemplate | null;
  /** Awaited after a successful score, to refresh the per-sentence badges. */
  onScored: () => Promise<void> | void;
};

export type Scoring = {
  result: SpeechEvaluateResponse | null;
  loading: boolean;
  scored: boolean;
  /** Word chip whose phoneme breakdown is expanded; null when none is. */
  expandedWord: number | null;
  /** Reports validation and API problems via `reportError`; never throws. */
  submit: (args: SubmitArgs) => Promise<void>;
  toggleWord: (index: number) => void;
  getPhonemesByWord: (word: string) => PhonemeResult[];
  /**
   * Discards the current score. Stable identity, so it is safe both as an effect
   * dependency and as the recording hook's `onRecordingStart` callback.
   */
  reset: () => void;
};

export function useScoring({ reportError }: UseScoringParams): Scoring {
  const [result, setResult] = useState<SpeechEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scored, setScored] = useState(false);
  const [expandedWord, setExpandedWord] = useState<number | null>(null);

  // Held in a ref so `submit` can keep an empty dependency array and a stable
  // identity even though the parent passes a fresh callback every render. The
  // ref is synced in an effect, never during render: `react-hooks/refs` forbids
  // writing to a ref while rendering.
  const reportErrorRef = useRef(reportError);
  useEffect(() => {
    reportErrorRef.current = reportError;
  });

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
        // Sentences are displayed in full but scored against a contracted form
        // ("I am" vs "I'm"), because that is what a speaker actually says. Only
        // templates carry that second form; free text is scored as written.
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
