"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  fetchLatestAssessmentResultsBySentence,
  TrainingAttemptResult,
} from "@/lib/api/assessmentResults";
import AppNav from "@/app/components/AppNav";
import { scorePronunciation } from "@/lib/api/pronunciationAssessment";
import {
  fetchSentenceCategories,
  fetchSentenceTemplates,
  SentenceCategory,
  SentenceTemplate,
} from "@/lib/api/sentenceTemplates";
import { generateTemplateSampleAudio } from "@/lib/api/tts";
import { SpeechEvaluateResponse } from "@/types/pronunciation";

// ── Static data ──────────────────────────────────────────────
const getCategoryIcon = (categoryKey: string | null) => {
  if (categoryKey === "daily") return "💬";
  if (categoryKey === "interview") return "🧑‍💼";
  if (categoryKey === "tech") return "💻";
  if (categoryKey === "portfolio") return "✨";
  return "📘";
};

// ── Helpers ──────────────────────────────────────────────────
const scoreTextColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const wordChipClass = (score: number) => {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
};

function getRecognitionStatusMessage(status?: string): string | null {
  switch (status) {
    case "Success":
      return null;
    case "NoMatch":
      return "Speech could not be recognized. Please try again.";
    case "InitialSilenceTimeout":
      return "No speech detected at the beginning. Please start speaking earlier.";
    case "BabbleTimeout":
      return "Audio was unclear or too noisy. Please try again in a quieter environment.";
    case "Error":
      return "An error occurred in Azure Speech. Please try again later.";
    default:
      return status ? `Unexpected recognition result: ${status}` : null;
  }
}

function isEffectivelyNoSpeech(result: SpeechEvaluateResponse): boolean {
  const words = result.words ?? [];
  const allOmitted =
    words.length > 0 && words.every((w) => w.errorType === "Omission");
  return (
    result.recognitionStatus === "Success" &&
    result.transcript?.trim() === "." &&
    result.sentenceScores?.pron === 0 &&
    allOmitted
  );
}

const MIC_AUTO_RELEASE_MS = 90_000;

const buildTemplateLatestScores = (
  attempts: TrainingAttemptResult[],
): Map<string, number> => {
  const latestBySentenceId = new Map<string, TrainingAttemptResult>();

  for (const attempt of attempts) {
    if (!attempt.sentenceId || attempt.overallScore == null) {
      continue;
    }

    const current = latestBySentenceId.get(attempt.sentenceId);

    if (
      !current ||
      new Date(attempt.scoredAt).getTime() >
        new Date(current.scoredAt).getTime()
    ) {
      latestBySentenceId.set(attempt.sentenceId, attempt);
    }
  }

  const result = new Map<string, number>();

  for (const [sentenceId, attempt] of latestBySentenceId.entries()) {
    result.set(sentenceId, Math.round(Number(attempt.overallScore)));
  }

  return result;
};

// ── Score card bg classes ────────────────────────────────────
const SCORE_CARD_BG = [
  "from-pink-50 to-white",
  "from-violet-50 to-white",
  "from-blue-50 to-white",
  "from-emerald-50 to-white",
];

// ── Section label ────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-widest uppercase text-purple-300 mb-3">
      {children}
    </p>
  );
}

// ── Card wrapper ─────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
export default function PronunciationPage() {
  // ── Core state ────────────────────────────────────────────
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);
  const [referenceText, setReferenceText] = useState(
    "Hi, There. It's all done.",
  );
  const [categories, setCategories] = useState<SentenceCategory[]>([]);
  const [templates, setTemplates] = useState<SentenceTemplate[]>([]);
  const [templateLatestScores, setTemplateLatestScores] = useState<
    Map<string, number>
  >(new Map());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [result, setResult] = useState<SpeechEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const [scored, setScored] = useState(false);
  // ── Audio player state (TTS / Roger) ─────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // ── Audio player state (my voice) ────────────────────────
  const [isMyVoicePlaying, setIsMyVoicePlaying] = useState(false);
  const [myVoiceCurrentTime, setMyVoiceCurrentTime] = useState(0);
  const [myVoiceDuration, setMyVoiceDuration] = useState(0);

  // ── UI state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [sidebarView, setSidebarView] = useState<"categories" | "phrases">(
    "categories",
  );

  // ── Refs ──────────────────────────────────────────────────
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  const releaseTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const myVoiceRef = useRef<HTMLAudioElement>(null);

  // ── Mic helpers ───────────────────────────────────────────
  const releaseMicrophone = () => {
    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
    setIsMicReady(false);
    setIsRecording(false);
  };

  const scheduleMicRelease = () => {
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = window.setTimeout(
      () => releaseMicrophone(),
      MIC_AUTO_RELEASE_MS,
    );
  };

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) void audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);
        setErrorMessage("");

        const data = await fetchSentenceCategories();

        if (ignore) {
          return;
        }

        setCategories(data);

        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load sentence categories.",
          );
        }
      } finally {
        if (!ignore) {
          setCategoryLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadAssessmentResults = async () => {
      try {
        const attempts = await fetchLatestAssessmentResultsBySentence();

        if (ignore) {
          return;
        }

        setTemplateLatestScores(buildTemplateLatestScores(attempts));
      } catch (error) {
        console.error(error);
      }
    };

    void loadAssessmentResults();

    return () => {
      ignore = true;
    };
  }, []);

  // ── when selected Category ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCategoryId) {
      setTemplates([]);
      setSelectedTemplateId(null);
      return;
    }

    let ignore = false;

    const loadTemplates = async () => {
      try {
        setTemplateLoading(true);
        setErrorMessage("");

        const data = await fetchSentenceTemplates(selectedCategoryId);

        if (ignore) {
          return;
        }

        setTemplates(data);

        if (data.length > 0) {
          const firstTemplate = data[0];
          setSelectedTemplateId(firstTemplate.id);
          setReferenceText(firstTemplate.displayText);
        } else {
          setSelectedTemplateId(null);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load sentence templates.",
          );
        }
      } finally {
        if (!ignore) {
          setTemplateLoading(false);
        }
      }
    };

    void loadTemplates();

    return () => {
      ignore = true;
    };
  }, [selectedCategoryId]);

  // ── Recording ─────────────────────────────────────────────
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone recording is not supported in this browser.");
      return;
    }
    try {
      setErrorMessage("");
      setResult(null);
      recordedChunksRef.current = [];
      setScored(false);
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (!recordingStreamRef.current)
        recordingStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      )
        audioContextRef.current = new AudioContext();
      if (audioContextRef.current.state === "suspended")
        await audioContextRef.current.resume();
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      const source = audioContextRef.current.createMediaStreamSource(
        recordingStreamRef.current,
      );
      sourceRef.current = source;
      const processor = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );
      processorRef.current = processor;
      processor.onaudioprocess = (e) =>
        recordedChunksRef.current.push(
          new Float32Array(e.inputBuffer.getChannelData(0)),
        );
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      setAudioFile(null);
      setRecordedAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsMicReady(true);
      setIsRecording(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to start microphone recording.",
      );
    }
  };

  const TARGET_SAMPLE_RATE = 16000;

  const mergeAudioChunks = (chunks: Float32Array[]) => {
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  };

  const resampleAudio = (data: Float32Array, from: number, to: number) => {
    if (from === to) return data;
    const ratio = from / to;
    const newLen = Math.round(data.length / ratio);
    const out = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const si = i * ratio;
      const ib = Math.floor(si);
      const ia = Math.min(ib + 1, data.length - 1);
      const w = si - ib;
      out[i] = data[ib] * (1 - w) + data[ia] * w;
    }
    return out;
  };

  const encodeWav = (samples: Float32Array, sampleRate: number) => {
    const bytesPerSample = 2,
      numChannels = 1;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const ws = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++)
        view.setUint8(offset + i, value.charCodeAt(i));
    };
    ws(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    ws(8, "WAVE");
    ws(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    ws(36, "data");
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (const s of samples) {
      const c = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, c < 0 ? c * 0x8000 : c * 0x7fff, true);
      offset += 2;
    }
    return new Blob([view], { type: "audio/wav" });
  };

  const handleStopRecording = () => {
    if (!audioContextRef.current) return;
    const sr = audioContextRef.current.sampleRate;
    const merged = mergeAudioChunks(recordedChunksRef.current);
    const resampled = resampleAudio(merged, sr, TARGET_SAMPLE_RATE);
    const wavBlob = encodeWav(resampled, TARGET_SAMPLE_RATE);
    const wavFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
      type: "audio/wav",
    });
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    setAudioFile(wavFile);
    setRecordedAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(wavBlob);
    });
    setIsRecording(false);
    scheduleMicRelease();
  };

  // ── TTS: generate then auto-play ──────────────────────────
  const handlePlaySample = async () => {
    // If already generated, toggle play/pause
    if (audioUrl && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }
    if (!referenceText.trim()) {
      setErrorMessage("Please enter reference text.");
      return;
    }
    try {
      setTtsLoading(true);
      setErrorMessage("");
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (!selectedTemplate) {
        setErrorMessage("Please select a sentence first.");
        return;
      }

      const response = await generateTemplateSampleAudio(selectedTemplate.id);

      setAudioUrl((previousUrl) => {
        if (previousUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previousUrl);
        }

        return response.audioUrl;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate sample audio.",
      );
    } finally {
      setTtsLoading(false);
    }
  };

  // Auto-play when audioUrl is set
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      void audioRef.current.play();
    }
  }, [audioUrl]);

  // ── Scoring ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!audioFile) {
      setErrorMessage("Please record audio or select an audio file.");
      setResult(null);
      return;
    }
    if (!referenceText.trim()) {
      setErrorMessage("Please enter reference text.");
      setResult(null);
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      const scoringText = selectedTemplate?.scoringText ?? referenceText;
      const response = await scorePronunciation(
        audioFile,
        scoringText,
        selectedTemplate?.id,
      );
      setResult(response);
      setExpandedWord(null);
      setScored(true);

      const attempts = await fetchLatestAssessmentResultsBySentence();
      setTemplateLatestScores(buildTemplateLatestScores(attempts));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to evaluate pronunciation.",
      );
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

  const selectTemplate = (template: SentenceTemplate) => {
    setSelectedTemplateId(template.id);
    setReferenceText(template.displayText);
    setResult(null);
    setAudioFile(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setIsPlaying(false);
    setCurrentTime(0);
    setRecordedAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSheetOpen(false);
  };

  // ── Derived ───────────────────────────────────────────────
  const words = result?.words ?? [];
  const sentenceScores = result?.sentenceScores;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;

  // ── Time formatter ────────────────────────────────────────
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // ═══════════════════════════════════════════════════════════
  // ── Render ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-blue-50 to-emerald-50">
      {/* ── Nav ── */}
      <AppNav />

      <div className="flex max-w-300 mx-auto md:gap-5 md:p-6">
        {/* ══════════════════════════════════════
            PC SIDEBAR — drill-down
        ══════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col gap-4 w-72 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* ── Category view ── */}
            {sidebarView === "categories" && (
              <div className="p-5">
                <SectionLabel>Category</SectionLabel>
                {categoryLoading ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Loading…
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setSidebarView("phrases");
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent px-3 py-2.5 text-left transition hover:border-purple-100 hover:bg-purple-50"
                      >
                        <span className="text-xl w-7 text-center shrink-0">
                          {getCategoryIcon(cat.categoryKey)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-gray-700 truncate">
                            {cat.displayName}
                          </span>
                          {cat.description && (
                            <span className="block text-[11px] text-gray-400 truncate">
                              {cat.description}
                            </span>
                          )}
                        </span>
                        <span className="text-purple-300 text-base transition group-hover:translate-x-0.5 group-hover:text-purple-400">
                          ›
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Phrase view ── */}
            {sidebarView === "phrases" && (
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setSidebarView("categories")}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-50 flex items-center justify-center text-gray-400 hover:text-purple-400 transition text-xs shrink-0"
                  >
                    ←
                  </button>
                  <span className="text-base shrink-0">
                    {selectedCategory
                      ? getCategoryIcon(selectedCategory.categoryKey)
                      : "📘"}
                  </span>
                  <span className="text-sm font-bold text-gray-700 flex-1 truncate">
                    {selectedCategory?.displayName ?? "Templates"}
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {templates.length}
                  </span>
                </div>

                {/* Phrase list */}
                {templateLoading ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    Loading…
                  </p>
                ) : templates.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    No templates yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {templates.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      const diff = template.difficulty?.toLowerCase() ?? "";
                      const diffBadge =
                        diff === "easy"
                          ? "bg-emerald-50 text-emerald-700"
                          : diff === "medium" || diff === "med"
                            ? "bg-amber-50 text-amber-600"
                            : diff === "hard"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-500";
                      const diffLabel =
                        diff.charAt(0).toUpperCase() + diff.slice(1) || "—";
                      const lastScore = templateLatestScores.get(template.id);
                      const dotColor =
                        lastScore == null
                          ? "bg-gray-200"
                          : lastScore >= 80
                            ? "bg-emerald-400"
                            : lastScore >= 60
                              ? "bg-amber-400"
                              : "bg-red-400";

                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => selectTemplate(template)}
                          className={`w-full text-left px-3 py-3 rounded-xl border-2 transition ${
                            isSelected
                              ? "border-purple-300 bg-linear-to-br from-purple-50 to-blue-50 shadow-sm"
                              : "border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200"
                          }`}
                        >
                          {/* Badge + title row */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffBadge}`}
                            >
                              {diffLabel}
                            </span>
                            {template.title && (
                              <span className="text-[10px] font-bold text-purple-400 truncate">
                                {template.title}
                              </span>
                            )}
                            {isSelected && (
                              <span className="ml-auto text-purple-400 text-xs shrink-0">
                                ✓
                              </span>
                            )}
                          </div>
                          {/* Phrase text */}
                          <p className="text-[13px] font-semibold text-gray-700 leading-snug">
                            {template.displayText}
                          </p>
                          {/* Score row */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                            />
                            {lastScore == null ? (
                              <span className="text-[11px] font-bold text-gray-400">
                                Not tried yet
                              </span>
                            ) : (
                              <span
                                className={`text-[11px] font-bold ${
                                  lastScore >= 80
                                    ? "text-emerald-600"
                                    : lastScore >= 60
                                      ? "text-amber-500"
                                      : "text-red-500"
                                }`}
                              >
                                Last: {lastScore}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ══════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════ */}
        <main className="flex-1 min-w-0 flex flex-col gap-4 px-4 pt-5 pb-10 md:px-0 md:pt-0">
          {/* Mobile: category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSheetOpen(true);
                }}
                className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                  selectedCategoryId === cat.id
                    ? "border-transparent bg-linear-to-r from-pink-300 to-violet-400 text-white"
                    : "border-purple-100 bg-white text-gray-400"
                }`}
              >
                {getCategoryIcon(cat.categoryKey)} {cat.displayName}
              </button>
            ))}
          </div>

          {/* ── Phrase panel ── */}
          <Card>
            <SectionLabel>Practice Phrase</SectionLabel>
            <p className="text-xl font-bold text-gray-800 leading-snug mb-4">
              {referenceText}
            </p>

            {/* Audio element — hidden, controlled via state */}
            <audio
              ref={audioRef}
              src={audioUrl ?? undefined}
              className="hidden"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              onTimeUpdate={() =>
                setCurrentTime(audioRef.current?.currentTime ?? 0)
              }
              onLoadedMetadata={() =>
                setDuration(audioRef.current?.duration ?? 0)
              }
            />

            <div className="flex flex-wrap items-center gap-3">
              {/* Play sample pill — morphs into inline player after generation */}
              {!audioUrl ? (
                <button
                  onClick={handlePlaySample}
                  disabled={ttsLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-purple-700 bg-linear-to-r from-blue-100 to-purple-100 hover:scale-105 transition disabled:opacity-50"
                >
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    {ttsLoading ? (
                      <svg
                        className="animate-spin w-3 h-3 text-purple-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg
                        width="8"
                        height="9"
                        viewBox="0 0 8 9"
                        fill="#a78bfa"
                      >
                        <polygon points="0,0 8,4.5 0,9" />
                      </svg>
                    )}
                  </div>
                  {ttsLoading ? "Generating…" : "Play sample · Roger"}
                </button>
              ) : (
                /* ── Inline mini-player pill ── */
                <div className="inline-flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-linear-to-r from-blue-100 to-purple-100">
                  {/* Play / Pause button */}
                  <button
                    onClick={handlePlaySample}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 hover:scale-110 transition"
                  >
                    {isPlaying ? (
                      /* Pause icon */
                      <svg
                        width="9"
                        height="10"
                        viewBox="0 0 9 10"
                        fill="#a78bfa"
                      >
                        <rect x="0" y="0" width="3" height="10" rx="1" />
                        <rect x="5.5" y="0" width="3" height="10" rx="1" />
                      </svg>
                    ) : (
                      /* Play icon */
                      <svg
                        width="8"
                        height="9"
                        viewBox="0 0 8 9"
                        fill="#a78bfa"
                      >
                        <polygon points="0,0 8,4.5 0,9" />
                      </svg>
                    )}
                  </button>

                  {/* Seekbar + time */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.01}
                      value={currentTime}
                      onChange={(e) => {
                        const t = Number(e.target.value);
                        setCurrentTime(t);
                        if (audioRef.current) audioRef.current.currentTime = t;
                      }}
                      className="w-24 h-1 accent-violet-400 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-purple-500 w-8 text-right tabular-nums">
                      {formatTime(currentTime)}
                    </span>
                  </div>

                  {/* Voice label */}
                  <span className="text-[11px] font-bold text-purple-400">
                    Roger
                  </span>
                </div>
              )}

              {/* Mobile: change phrase */}
              <button
                onClick={() => setSheetOpen(true)}
                className="md:hidden inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
              >
                ✦ Change phrase
              </button>
            </div>
          </Card>

          {/* ── Record panel ── */}
          <Card>
            {/* Header row: label + mic status */}
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[10px] font-bold tracking-widest uppercase text-purple-300">
                Record
              </p>
              {isMicReady && !isRecording && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Mic ready
                  </span>
                  <button
                    onClick={releaseMicrophone}
                    className="text-[11px] text-gray-400 border border-gray-200 rounded-md px-2 py-0.5 hover:text-gray-600 hover:border-gray-300 transition"
                  >
                    Turn off
                  </button>
                </div>
              )}
              {isRecording && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  Recording…
                </span>
              )}
            </div>

            {/* Hidden audio element for recorded voice playback */}
            <audio
              ref={myVoiceRef}
              src={recordedAudioUrl ?? undefined}
              className="hidden"
              onPlay={() => setIsMyVoicePlaying(true)}
              onPause={() => setIsMyVoicePlaying(false)}
              onEnded={() => {
                setIsMyVoicePlaying(false);
                setMyVoiceCurrentTime(0);
              }}
              onTimeUpdate={() =>
                setMyVoiceCurrentTime(myVoiceRef.current?.currentTime ?? 0)
              }
              onLoadedMetadata={() =>
                setMyVoiceDuration(myVoiceRef.current?.duration ?? 0)
              }
            />

            <div className="flex items-center gap-3 flex-wrap">
              {/* Record / Stop toggle */}
              <button
                onClick={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                disabled={loading}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-white transition hover:scale-105 disabled:opacity-50 ${
                  isRecording
                    ? "bg-linear-to-r from-red-400 to-red-500"
                    : "bg-linear-to-r from-pink-300 to-violet-400"
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-sm bg-white opacity-90 shrink-0" />
                    Stop
                  </>
                ) : (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full bg-white opacity-90 shrink-0 ring-2 ring-white/40" />
                    Record
                  </>
                )}
              </button>

              {/* Score button */}
              <button
                onClick={handleSubmit}
                disabled={loading || isRecording || !audioFile || scored}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-linear-to-r from-violet-400 to-indigo-400 hover:scale-105 transition disabled:opacity-40"
              >
                {loading ? (
                  <svg
                    className="animate-spin w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
                {loading ? "Scoring…" : "Score"}
              </button>

              {/* My voice mini-player — appears after recording */}
              {recordedAudioUrl && (
                <div className="inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-linear-to-r from-pink-100 to-rose-100">
                  <button
                    onClick={() => {
                      if (!myVoiceRef.current) return;
                      if (myVoiceRef.current.paused) {
                        void myVoiceRef.current.play();
                      } else {
                        myVoiceRef.current.pause();
                      }
                    }}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 hover:scale-110 transition"
                  >
                    {isMyVoicePlaying ? (
                      <svg
                        width="9"
                        height="10"
                        viewBox="0 0 9 10"
                        fill="#f472b6"
                      >
                        <rect x="0" y="0" width="3" height="10" rx="1" />
                        <rect x="5.5" y="0" width="3" height="10" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        width="8"
                        height="9"
                        viewBox="0 0 8 9"
                        fill="#f472b6"
                      >
                        <polygon points="0,0 8,4.5 0,9" />
                      </svg>
                    )}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min={0}
                      max={myVoiceDuration || 1}
                      step={0.01}
                      value={myVoiceCurrentTime}
                      onChange={(e) => {
                        const t = Number(e.target.value);
                        setMyVoiceCurrentTime(t);
                        if (myVoiceRef.current)
                          myVoiceRef.current.currentTime = t;
                      }}
                      className="w-20 h-1 accent-pink-400 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-pink-500 w-8 text-right tabular-nums">
                      {formatTime(myVoiceCurrentTime)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-pink-400">
                    You
                  </span>
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600">
                {errorMessage}
              </p>
            )}
          </Card>

          {/* ── Warning banners ── */}
          {result && result.recognitionStatus !== "Success" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {getRecognitionStatusMessage(result.recognitionStatus)}
            </div>
          )}
          {result &&
            result.recognitionStatus === "Success" &&
            isEffectivelyNoSpeech(result) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Almost no speech was recognized. Please try recording again.
              </div>
            )}

          {/* ── Results ── */}
          {result &&
            result.recognitionStatus === "Success" &&
            !isEffectivelyNoSpeech(result) && (
              <div className="flex flex-col gap-4">
                {/* Score summary */}
                <Card>
                  <SectionLabel>Scores</SectionLabel>
                  <div className="flex items-center gap-4 mb-5 flex-wrap">
                    <div>
                      <span
                        className={`text-5xl font-black font-mono leading-none ${scoreTextColor(sentenceScores?.pron ?? 0)}`}
                      >
                        {sentenceScores?.pron}
                      </span>
                      <span className="text-sm text-gray-300 ml-1">/100</span>
                    </div>
                    <div className="w-px h-12 bg-gray-100 hidden sm:block" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                      {[
                        {
                          label: "Accuracy",
                          value: sentenceScores?.accuracy ?? 0,
                        },
                        {
                          label: "Fluency",
                          value: sentenceScores?.fluency ?? 0,
                        },
                        {
                          label: "Completeness",
                          value: sentenceScores?.completeness ?? 0,
                        },
                        {
                          label: "Prosody",
                          value: sentenceScores?.prosody ?? 0,
                        },
                      ].map(({ label, value }, i) => (
                        <div
                          key={label}
                          className={`rounded-xl p-3 bg-linear-to-br ${SCORE_CARD_BG[i]}`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                            {label}
                          </p>
                          <p
                            className={`text-xl font-black font-mono leading-none ${scoreTextColor(value)}`}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-mono border-t border-gray-100 pt-3">
                    {result.transcript}
                  </p>
                </Card>

                {/* Word scores */}
                {words.length > 0 && (
                  <Card>
                    <SectionLabel>Word Scores</SectionLabel>
                    <div className="flex flex-wrap gap-3 mb-2">
                      {words.map((wordResult, index) => {
                        const wordScore = Number(
                          wordResult.scores?.accuracyScore ??
                            wordResult.scores?.accuracy ??
                            0,
                        );
                        const isOpen = expandedWord === index;
                        return (
                          <button
                            key={`${wordResult.word}-${index}`}
                            onClick={() =>
                              setExpandedWord(isOpen ? null : index)
                            }
                            className={`flex flex-col items-center gap-1 px-4 pt-2.5 pb-2 rounded-2xl border-2 transition hover:-translate-y-0.5 ${wordChipClass(wordScore)} ${isOpen ? "ring-2 ring-offset-1 ring-purple-300" : ""}`}
                          >
                            <span className="text-sm font-bold leading-none">
                              {wordResult.word}
                            </span>
                            <span
                              className={`text-lg font-black font-mono leading-none ${scoreTextColor(wordScore)}`}
                            >
                              {wordScore}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-purple-300 font-semibold mb-3">
                      ✨ Tap a word for phoneme details
                    </p>

                    {expandedWord !== null &&
                      words[expandedWord] &&
                      (() => {
                        const wordResult = words[expandedWord];
                        const phonemes = getPhonemesByWord(wordResult.word);
                        return (
                          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                            {phonemes.length > 0 ? (
                              <div className="flex flex-wrap gap-2.5">
                                {phonemes.map((ph, pi) => {
                                  const acc = Number(
                                    ph.scores?.accuracyScore ??
                                      ph.scores?.accuracy ??
                                      0,
                                  );
                                  const c1 = ph.candidates?.[0] ?? null;
                                  const perfect = acc >= 80;
                                  const ok = acc >= 60;
                                  return (
                                    <div
                                      key={`${ph.phoneme}-${pi}`}
                                      className={`flex flex-col items-center gap-2 rounded-2xl px-4 py-3.5 shadow-sm border ${
                                        perfect
                                          ? "bg-white border-emerald-100"
                                          : ok
                                            ? "bg-white border-amber-100"
                                            : "bg-red-50/60 border-red-100"
                                      }`}
                                    >
                                      {/* Target phoneme */}
                                      <span className="text-base font-black font-mono text-gray-800 leading-none">
                                        {ph.phoneme}
                                      </span>
                                      {/* Accuracy score */}
                                      <span
                                        className={`text-base font-black font-mono leading-none ${scoreTextColor(acc)}`}
                                      >
                                        {acc}
                                      </span>
                                      {/* 1st candidate IPA */}
                                      {c1 && c1 !== "-" && (
                                        <span className="text-base italic font-mono text-purple-400 leading-none">
                                          {c1}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs italic text-gray-400">
                                No phoneme data available for this word.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                  </Card>
                )}
              </div>
            )}
        </main>
      </div>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM SHEET
      ══════════════════════════════════════ */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:hidden bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
        >
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
              <div>
                <p className="text-base font-black text-gray-800">
                  {selectedCategory
                    ? `${getCategoryIcon(selectedCategory.categoryKey)} ${selectedCategory.displayName}`
                    : "Select a phrase"}
                </p>
                <p className="text-[11px] text-gray-400">No phrases yet</p>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3 pb-8">
              {/* Demo phrases always available */}
              {templateLoading ? (
                <p className="text-sm text-gray-400">Loading templates...</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-400">No templates yet.</p>
              ) : (
                templates.map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  const diff = template.difficulty?.toLowerCase() ?? "";
                  const diffBadge =
                    diff === "easy"
                      ? "bg-emerald-50 text-emerald-700"
                      : diff === "medium" || diff === "med"
                        ? "bg-amber-50 text-amber-600"
                        : diff === "hard"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-500";
                  const diffLabel =
                    diff.charAt(0).toUpperCase() + diff.slice(1) || "—";
                  const lastScore = templateLatestScores.get(template.id);
                  const dotColor =
                    lastScore == null
                      ? "bg-gray-200"
                      : lastScore >= 80
                        ? "bg-emerald-400"
                        : lastScore >= 60
                          ? "bg-amber-400"
                          : "bg-red-400";

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-left transition ${
                        isSelected
                          ? "border-purple-300 bg-linear-to-br from-purple-50 to-blue-50"
                          : "border-gray-100 bg-gray-50 hover:border-purple-200 hover:bg-purple-50"
                      }`}
                    >
                      {/* Badge + title row */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diffBadge}`}
                        >
                          {diffLabel}
                        </span>
                        {template.title && (
                          <span className="text-[10px] font-bold text-purple-400 truncate">
                            {template.title}
                          </span>
                        )}
                        {isSelected && (
                          <span className="ml-auto text-purple-400 text-xs shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      {/* Phrase text */}
                      <p className="text-sm font-semibold text-gray-700 leading-snug mb-2">
                        {template.displayText}
                      </p>
                      {/* Score row */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                        />
                        {lastScore == null ? (
                          <span className="text-[11px] font-bold text-gray-400">
                            Not tried yet
                          </span>
                        ) : (
                          <span
                            className={`text-[11px] font-bold ${
                              lastScore >= 80
                                ? "text-emerald-600"
                                : lastScore >= 60
                                  ? "text-amber-500"
                                  : "text-red-500"
                            }`}
                          >
                            Last: {lastScore}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
