"use client";

import { useRef, useState } from "react";
import {
  generateSampleSpeech,
  scorePronunciation,
} from "@/lib/api/pronunciation";
import { SpeechEvaluateResponse } from "@/types/pronunciation";

const scoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const errorChipClass = (errorType: string) => {
  const key = (errorType ?? "none").toLowerCase().replace(/\s+/g, "");
  if (key === "none")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (key === "mispronunciation")
    return "bg-red-50 text-red-600 border border-red-200";
  if (key === "omission")
    return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-gray-100 text-gray-500 border border-gray-200";
};

const formatTime = (sec: number) => {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function PronunciationPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [referenceText, setReferenceText] = useState(
    "Hi, There. It's all done.",
  );
  const [result, setResult] = useState<SpeechEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
  };

  const handleLoadedMetadata = () => {
    const el = audioRef.current;
    if (!el) return;
    setDuration(el.duration);
  };

  const handleEnded = () => setIsPlaying(false);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const val = Number(e.target.value);
    el.currentTime = val;
    setCurrentTime(val);
  };

  const handleGenerateSampleSpeech = async () => {
    if (!referenceText.trim()) {
      setErrorMessage("Please enter reference text.");
      return;
    }

    try {
      setTtsLoading(true);
      setErrorMessage("");
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const blob = await generateSampleSpeech(referenceText);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to generateSampleAudio.",
      );
    } finally {
      setTtsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      setErrorMessage("Please select an audio file.");
      return;
    }
    if (!referenceText.trim()) {
      setErrorMessage("Please enter reference text.");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await scorePronunciation(audioFile, referenceText);
      setResult(response);
      setExpandedWord(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getPhonemesByWord = (word: string) => {
    if (!result?.phonemes) return [];
    return result.phonemes.filter(
      (p) => p.word?.toLowerCase() === word.toLowerCase(),
    );
  };

  const words = result?.words ?? [];
  const sentenceScores = result?.sentenceScores;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Pronunciation Scoring
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Azure Speech AI · Phoneme-level Assessment
          </p>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4 shadow-sm">
          <div className="flex flex-col gap-3">
            {/* Reference text */}
            <div className="flex flex-col gap-2">
              {/* Label row with Generate button */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="referenceText"
                  className="text-xs font-semibold text-gray-600"
                >
                  Reference Text
                </label>
                <button
                  onClick={handleGenerateSampleSpeech}
                  disabled={ttsLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ttsLoading ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Generate sample voice
                    </>
                  )}
                </button>
              </div>

              <textarea
                id="referenceText"
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                rows={2}
                placeholder="I want to improve my pronunciation..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-300 outline-none transition focus:border-gray-400 focus:bg-white resize-none"
              />

              {/* Custom audio player */}
              {audioUrl && (
                <>
                  {/* Hidden native audio for playback logic */}
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition hover:bg-gray-700"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    {/* Progress bar */}
                    <div className="relative flex-1 h-1.5 rounded-full bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gray-700 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.01}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </div>

                    {/* Time */}
                    <span className="shrink-0 font-mono text-[0.65rem] text-gray-500 tabular-nums">
                      {formatTime(currentTime)}{" "}
                      <span className="text-gray-300">/</span>{" "}
                      {formatTime(duration)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* File picker + Score */}
            <div className="flex items-center gap-3">
              <label
                className={`flex-1 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition
                ${audioFile ? "border-gray-300 bg-gray-50 text-gray-700" : "border-dashed border-gray-200 text-gray-400 hover:border-gray-300"}`}
              >
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-base">{audioFile ? "🎵" : "📁"}</span>
                <span className="truncate">
                  {audioFile ? audioFile.name : "Select audio file..."}
                </span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="shrink-0 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Scoring..." : "Score →"}
              </button>
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-3">
            {/* Summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-6">
                {/* Overall score */}
                <div className="shrink-0">
                  <span
                    className={`text-4xl font-bold font-mono leading-none ${scoreColor(sentenceScores?.pron ?? 0)}`}
                  >
                    {sentenceScores?.pron}
                  </span>
                  <span className="text-sm text-gray-400 ml-0.5">/100</span>
                </div>

                <div className="h-10 w-px bg-gray-200 shrink-0 self-center" />

                {/* Sentence scores */}
                <div className="grid grid-cols-4 gap-4 flex-1">
                  {[
                    {
                      label: "Accuracy",
                      value: sentenceScores?.accuracy ?? 0,
                    },
                    { label: "Fluency", value: sentenceScores?.fluency ?? 0 },
                    {
                      label: "Completeness",
                      value: result.sentenceScores.completeness,
                    },
                    { label: "Prosody", value: sentenceScores?.prosody ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-gray-500 mb-0.5">
                        {label}
                      </p>
                      <p
                        className={`text-lg font-bold font-mono leading-none ${scoreColor(value)}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500 font-mono border-t border-gray-100 pt-3">
                {result.transcript}
              </p>
            </div>

            {/* Words */}
            {words.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-gray-500">
                    Word-level Breakdown
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {words.map((wordResult, index) => {
                    const isOpen = expandedWord === index;
                    const phonemes = getPhonemesByWord(wordResult.word);

                    return (
                      <div key={`${wordResult.word}-${index}`}>
                        <button
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition"
                          onClick={() => setExpandedWord(isOpen ? null : index)}
                        >
                          <span className="w-20 shrink-0 font-mono text-sm font-medium text-gray-800">
                            {wordResult.word}
                          </span>

                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[0.62rem] font-medium ${errorChipClass(wordResult.errorType ?? "")}`}
                          >
                            {wordResult.errorType || "None"}
                          </span>

                          <div className="ml-auto flex gap-5">
                            {Object.entries(wordResult.scores ?? {})
                              .slice(0, 3)
                              .map(([key, val]) => (
                                <div key={key} className="text-right">
                                  <div className="text-[0.58rem] font-semibold uppercase tracking-widest text-gray-500">
                                    {key.replace(/score/i, "")}
                                  </div>
                                  <div
                                    className={`font-mono text-sm font-bold ${scoreColor(Number(val))}`}
                                  >
                                    {Number(val)}
                                  </div>
                                </div>
                              ))}
                          </div>

                          <svg
                            className={`ml-3 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                            {phonemes.length > 0 ? (
                              <table className="w-full text-xs font-mono">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    {[
                                      "Phoneme",
                                      "Expected IPA",
                                      "Accuracy",
                                      "1st Candidate",
                                      "2nd Candidate",
                                    ].map((h, hi) => (
                                      <th
                                        key={`${h}-${hi}`}
                                        className="pb-1.5 text-left text-[0.58rem] font-semibold uppercase tracking-widest text-gray-500"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {phonemes.map((ph, pi) => {
                                    const acc = Number(
                                      ph.scores?.accuracyScore ??
                                        ph.scores?.accuracy ??
                                        0,
                                    );
                                    const candidate1 =
                                      ph.candidates?.[0] ?? "-";
                                    const candidate2 =
                                      ph.candidates?.[1] ?? "-";
                                    const candidate1Score = Number(
                                      ph.scores?.candidate1Score ?? 0,
                                    );
                                    const candidate2Score = Number(
                                      ph.scores?.candidate2Score ?? 0,
                                    );
                                    return (
                                      <tr
                                        key={`${ph.phoneme}-${pi}`}
                                        className="border-b border-gray-100 last:border-0"
                                      >
                                        <td className="py-1.5 text-sm font-semibold text-gray-800">
                                          {ph.phoneme}
                                        </td>
                                        <td className="py-1.5 italic text-gray-500">
                                          {ph.expectedIpa}
                                        </td>
                                        <td
                                          className={`py-1.5 font-bold ${scoreColor(acc)}`}
                                        >
                                          {acc}
                                        </td>
                                        {/* 1st Candidate */}
                                        <td className="py-1.5">
                                          <span className="w-28 inline-flex items-center gap-1.5">
                                            <span className="w-6 rounded bg-gray-200 px-1.5 py-0.5 text-[0.65rem] text-gray-600">
                                              {candidate1}
                                            </span>
                                            <span
                                              className={`font-bold px-1.5 py-0.5  ${scoreColor(candidate1Score)}`}
                                            >
                                              {candidate1Score || "-"}
                                            </span>
                                          </span>
                                        </td>
                                        {/* 2nd Candidate */}
                                        <td className="py-1.5">
                                          <span className="w-28 inline-flex items-center gap-1.5">
                                            <span className="w-6 rounded bg-gray-200 px-1.5 py-0.5 text-[0.65rem] text-gray-600">
                                              {candidate2}
                                            </span>
                                            <span
                                              className={`font-bold px-1.5 py-0.5  ${scoreColor(candidate2Score)}`}
                                            >
                                              {candidate2Score || "-"}
                                            </span>
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs italic text-gray-500">
                                No phoneme data available for this word.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw JSON */}
            {result?.rawJson != null && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition"
                  onClick={() => setRawJsonOpen((prev) => !prev)}
                >
                  <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-gray-500">
                    Raw JSON
                  </p>
                  <svg
                    className={`text-gray-400 transition-transform ${rawJsonOpen ? "rotate-180" : ""}`}
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {rawJsonOpen && (
                  <pre className="overflow-x-auto border-t border-gray-100 bg-gray-50 px-4 py-3 text-[11px] leading-5 text-gray-700">
                    {JSON.stringify(result.rawJson, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
