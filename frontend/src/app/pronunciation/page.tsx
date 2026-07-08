"use client";

import { useEffect, useRef, useState } from "react";
import AppNav from "@/components/AppNav";
import { SentenceTemplate } from "@/lib/api/sentenceTemplates";
import { SpeechEvaluateResponse } from "@/types/pronunciation";
import { useCategoryTemplateManager } from "@/hooks/pronunciation/useCategoryTemplateManager";
import { useRecordingSession } from "@/hooks/pronunciation/useRecordingSession";
import { useSampleAudioPlayer } from "@/hooks/pronunciation/useSampleAudioPlayer";
import { useScoring } from "@/hooks/pronunciation/useScoring";

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
  // ── Shared error banner (fed by every hook + local validation) ─
  const [errorMessage, setErrorMessage] = useState("");
  // ── Audio player state (my voice) ────────────────────────
  const [isMyVoicePlaying, setIsMyVoicePlaying] = useState(false);
  const [myVoiceCurrentTime, setMyVoiceCurrentTime] = useState(0);
  const [myVoiceDuration, setMyVoiceDuration] = useState(0);

  // ── UI state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const myVoiceRef = useRef<HTMLAudioElement>(null);

  // Sample-audio player (TTS / Roger). Passive: the page decides *when* to
  // preload (effect below); the hook owns generation, caching and playback.
  const player = useSampleAudioPlayer({
    reportError: setErrorMessage,
  });
  const { preload: preloadSampleAudio } = player;

  const catTpl = useCategoryTemplateManager({
    resetSampleAudioState: player.resetState,
    removeCachedAudioForTemplate: player.removeCachedForTemplate,
    reportError: setErrorMessage,
  });

  // Scoring (assessment run + result/scored/expandedWord). Independent of the
  // other hooks at init; the page supplies its inputs at submit time.
  const scoring = useScoring({ reportError: setErrorMessage });
  const { reset: resetScoring } = scoring;
  const { result, loading, scored, expandedWord, toggleWord, getPhonemesByWord } =
    scoring;

  const recording = useRecordingSession({
    canRecord: catTpl.selectedTemplate !== null,
    // Starting a new recording invalidates the previous score.
    onRecordingStart: resetScoring,
    reportError: setErrorMessage,
  });
  const { reset: resetRecording } = recording;

  // ── TTS: play sample (generate + auto-play, or toggle) ────
  const handlePlaySample = () => {
    setErrorMessage("");
    void player.playSample(catTpl.selectedTemplate, catTpl.referenceText);
  };

  // ── Scoring ───────────────────────────────────────────────
  const handleSubmit = () =>
    scoring.submit({
      audioFile: recording.audioFile,
      referenceText: catTpl.referenceText,
      template: selectedTemplate,
      onScored: catTpl.refreshLatestScores,
    });

  // Domain-level guard lives here (not in the hook): "you must pick a
  // sentence before recording" is a page concern. The hook only knows a
  // boolean `canRecord` and stays silent when it's false.
  const handleRecordClick = () => {
    if (recording.isRecording) {
      recording.stopRecording();
      return;
    }
    if (!selectedTemplate) {
      setErrorMessage("Please select a sentence first.");
      return;
    }
    setErrorMessage("");
    void recording.startRecording();
  };

  const selectTemplate = (template: SentenceTemplate) => {
    catTpl.selectTemplate(template);
    setSheetOpen(false);
  };

  const handleToggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void catTpl.toggleFavorite(templateId);
  };

  // ── Derived ───────────────────────────────────────────────
  const words = result?.words ?? [];
  const sentenceScores = result?.sentenceScores;
  const selectedCategory = catTpl.categories.find(
    (c) => c.id === catTpl.selectedCategoryId,
  );
  const selectedTemplate = catTpl.selectedTemplate;
  const hasSelectedTemplate = selectedTemplate !== null;

  // Reset scoring state and discard any recording whenever the selected
  // template changes. Without the recording.reset(), the previous sentence's
  // "My voice" player and captured audioFile stayed around after switching.
  useEffect(() => {
    resetScoring();
    resetRecording();
  }, [catTpl.selectedTemplateId, resetScoring, resetRecording]);

  // Preload the sample audio whenever the selected template changes. The page
  // owns the *timing* (this effect); the hook owns generation/caching/loading.
  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    void preloadSampleAudio(selectedTemplate);
  }, [selectedTemplate, preloadSampleAudio]);

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
            {catTpl.sidebarView === "categories" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Category</SectionLabel>
                  <button
                    type="button"
                    onClick={() => catTpl.openNewCategoryForm(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-500 bg-purple-50 hover:bg-purple-100 transition"
                  >
                    + New
                  </button>
                </div>
                {catTpl.categoryLoading ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Loading…
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {catTpl.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent px-3 py-2.5 transition hover:border-purple-100 hover:bg-purple-50"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          onClick={() => {
                            catTpl.selectCategory(cat.id);
                            catTpl.setSidebarView("phrases");
                          }}
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
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit ${cat.displayName}`}
                          onClick={() =>
                            catTpl.openEditCategoryForm(cat, false)
                          }
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs shrink-0"
                        >
                          ✎
                        </button>
                        <span className="text-purple-300 text-base transition group-hover:translate-x-0.5 group-hover:text-purple-400 shrink-0">
                          ›
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Phrase view ── */}
            {catTpl.sidebarView === "phrases" && (
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => catTpl.setSidebarView("categories")}
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
                  <button
                    type="button"
                    onClick={() => catTpl.openNewTemplateForm(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-500 bg-purple-50 hover:bg-purple-100 transition shrink-0"
                  >
                    + New
                  </button>
                </div>

                {/* Fav filter toggle */}
                <button
                  onClick={() => catTpl.setFavoritesOnly((v) => !v)}
                  className={`mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                    catTpl.favoritesOnly
                      ? "bg-amber-50 border-amber-300 text-amber-600"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:border-purple-200 hover:text-purple-400"
                  }`}
                >
                  {catTpl.favoritesOnly ? "★" : "☆"} Favorites only
                </button>

                {/* Phrase list */}
                {catTpl.templateLoading ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    Loading…
                  </p>
                ) : catTpl.filteredTemplates.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    {catTpl.favoritesOnly
                      ? "No catTpl.favorites yet."
                      : "No catTpl.templates yet."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {catTpl.filteredTemplates.map((template) => {
                      const isSelected =
                        catTpl.selectedTemplateId === template.id;
                      const isFav = catTpl.favorites.has(template.id);
                      const diff = template.difficulty?.toLowerCase() ?? "";
                      const diffBadge =
                        diff === "easy"
                          ? "bg-emerald-50 text-emerald-700"
                          : diff === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : diff === "hard"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-500";
                      const diffLabel =
                        diff.charAt(0).toUpperCase() + diff.slice(1) || "—";
                      const lastScore = catTpl.templateLatestScores.get(
                        template.id,
                      );
                      const dotColor =
                        lastScore == null
                          ? "bg-gray-200"
                          : lastScore >= 80
                            ? "bg-emerald-400"
                            : lastScore >= 60
                              ? "bg-amber-400"
                              : "bg-red-400";

                      return (
                        <div
                          key={template.id}
                          className={`group relative w-full rounded-xl border-2 transition ${
                            isSelected
                              ? "border-purple-300 bg-linear-to-br from-purple-50 to-blue-50 shadow-sm"
                              : "border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectTemplate(template)}
                            className="w-full text-left px-3 py-3 pr-14"
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
                            </div>
                            {/* Phrase text */}
                            <p className="text-[13px] font-semibold text-gray-700 leading-snug">
                              {template.displayText}
                            </p>
                            {/* Score row */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                              />
                              {lastScore == null ? (
                                <span className="text-[11px] font-bold text-gray-400">
                                  Not tried yet
                                </span>
                              ) : (
                                <span
                                  className={`text-[11px] font-bold ${lastScore >= 80 ? "text-emerald-600" : lastScore >= 60 ? "text-amber-500" : "text-red-500"}`}
                                >
                                  Last: {lastScore}
                                </span>
                              )}
                            </div>
                          </button>
                          {/* Star - always visible, outside select button */}
                          <button
                            type="button"
                            onClick={(e) =>
                              handleToggleFavorite(template.id, e)
                            }
                            className={`absolute top-2.5 right-8 text-sm transition hover:scale-125 ${isFav ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}
                          >
                            {isFav ? "★" : "☆"}
                          </button>
                          {/* Edit - visible on hover */}
                          <button
                            type="button"
                            aria-label="Edit phrase"
                            onClick={() =>
                              catTpl.openEditTemplateForm(template, false)
                            }
                            className="absolute top-2 right-1 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs"
                          >
                            ✎
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* ── Phrase form view ── */}
            {catTpl.sidebarView === "phrase-form" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => catTpl.setSidebarView("phrases")}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-50 flex items-center justify-center text-gray-400 hover:text-purple-400 transition text-xs shrink-0"
                  >
                    ←
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    {catTpl.editingTemplateId ? "Edit phrase" : "New phrase"}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Category chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {catTpl.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            catTpl.setTemplateFormCategoryId(cat.id)
                          }
                          className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition ${
                            catTpl.templateFormCategoryId === cat.id
                              ? "border-purple-300 bg-purple-50 text-purple-700"
                              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-purple-200"
                          }`}
                        >
                          {getCategoryIcon(cat.categoryKey)} {cat.displayName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Title
                    </label>
                    <input
                      type="text"
                      value={catTpl.templateFormTitle}
                      onChange={(e) =>
                        catTpl.setTemplateFormTitle(e.target.value)
                      }
                      placeholder="e.g. Why Australia"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                    />
                  </div>

                  {/* Phrase text */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Phrase text
                    </label>
                    <textarea
                      value={catTpl.templateFormText}
                      onChange={(e) =>
                        catTpl.setTemplateFormText(e.target.value)
                      }
                      placeholder="e.g. I've always wanted to..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* Difficulty chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            catTpl.setTemplateFormDifficulty(
                              catTpl.templateFormDifficulty === d ? "" : d,
                            )
                          }
                          className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition ${
                            catTpl.templateFormDifficulty === d
                              ? d === "easy"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : d === "medium"
                                  ? "border-amber-300 bg-amber-50 text-amber-700"
                                  : "border-red-300 bg-red-50 text-red-700"
                              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-purple-200"
                          }`}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => catTpl.setSidebarView("phrases")}
                      className="flex-1 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold py-2 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={catTpl.handleSaveTemplate}
                      disabled={!catTpl.templateFormText.trim()}
                      className="flex-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-bold py-2 transition"
                    >
                      Save
                    </button>
                  </div>

                  {catTpl.editingTemplateId && (
                    <button
                      type="button"
                      onClick={() =>
                        catTpl.handleDeleteTemplate(catTpl.editingTemplateId!)
                      }
                      className="w-full rounded-xl border border-red-200 text-red-400 hover:bg-red-50 text-sm font-bold py-2 transition"
                    >
                      Delete phrase
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* ── Category form view ── */}
            {catTpl.sidebarView === "category-form" && (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => catTpl.setSidebarView("categories")}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-50 flex items-center justify-center text-gray-400 hover:text-purple-400 transition text-xs shrink-0"
                  >
                    ←
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    {catTpl.editingCategoryId
                      ? "Edit category"
                      : "New category"}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Name
                    </label>
                    <input
                      type="text"
                      value={catTpl.categoryFormName}
                      onChange={(e) =>
                        catTpl.setCategoryFormName(e.target.value)
                      }
                      placeholder="e.g. Business"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={catTpl.categoryFormDesc}
                      onChange={(e) =>
                        catTpl.setCategoryFormDesc(e.target.value)
                      }
                      placeholder="Short description"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={catTpl.handleSaveCategory}
                    disabled={!catTpl.categoryFormName.trim()}
                    className="w-full rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-bold py-2.5 transition"
                  >
                    {catTpl.editingCategoryId
                      ? "Save changes"
                      : "Create category"}
                  </button>

                  {catTpl.editingCategoryId && (
                    <button
                      type="button"
                      onClick={() =>
                        catTpl.handleDeleteCategory(catTpl.editingCategoryId!)
                      }
                      className="w-full rounded-xl border border-red-200 text-red-400 hover:bg-red-50 text-sm font-bold py-2 transition"
                    >
                      Delete category
                    </button>
                  )}
                </div>
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
            {catTpl.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  catTpl.selectCategory(cat.id);
                  catTpl.setSheetView("phrases");
                  setSheetOpen(true);
                }}
                className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                  catTpl.selectedCategoryId === cat.id
                    ? "border-transparent bg-linear-to-r from-pink-300 to-violet-400 text-white"
                    : "border-purple-100 bg-white text-gray-400"
                }`}
              >
                {getCategoryIcon(cat.categoryKey)} {cat.displayName}
              </button>
            ))}
            <button
              type="button"
              aria-label="Manage catTpl.categories"
              onClick={() => {
                catTpl.setSheetView("categories");
                setSheetOpen(true);
              }}
              className="shrink-0 rounded-full border-2 border-gray-100 bg-white text-gray-400 hover:border-purple-200 hover:text-purple-400 w-10 h-10 flex items-center justify-center transition text-base"
            >
              ⚙
            </button>
          </div>

          {/* ── Phrase panel ── */}
          <Card>
            <SectionLabel>Practice Phrase</SectionLabel>
            <p
              className={`text-xl font-bold leading-snug mb-4 ${
                hasSelectedTemplate ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {catTpl.referenceText}
            </p>

            {/* Audio element — hidden, controlled via the player hook */}
            <audio {...player.audioProps} className="hidden" />

            <div className="flex flex-wrap items-center gap-3">
              {/* Play sample pill — morphs into inline player after generation */}
              {hasSelectedTemplate && (
                <>
                  {!player.audioUrl ? (
                    <button
                      onClick={handlePlaySample}
                      disabled={player.ttsLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-purple-700 bg-linear-to-r from-blue-100 to-purple-100 hover:scale-105 transition disabled:opacity-50"
                    >
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                        {player.ttsLoading ? (
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
                      {player.ttsLoading
                        ? "Generating…"
                        : "Play sample · Roger"}
                    </button>
                  ) : (
                    /* ── Inline mini-player pill ── */
                    <div className="inline-flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-linear-to-r from-blue-100 to-purple-100">
                      {/* Play / Pause button */}
                      <button
                        onClick={handlePlaySample}
                        className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 hover:scale-110 transition"
                      >
                        {player.isPlaying ? (
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
                          max={player.duration || 1}
                          step={0.01}
                          value={player.currentTime}
                          onChange={(e) => player.seek(Number(e.target.value))}
                          className="w-24 h-1 accent-violet-400 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-purple-500 w-8 text-right tabular-nums">
                          {formatTime(player.currentTime)}
                        </span>
                      </div>

                      {/* Voice label */}
                      <span className="text-[11px] font-bold text-purple-400">
                        Roger
                      </span>
                    </div>
                  )}
                </>
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
          {hasSelectedTemplate && (
            <Card>
              {/* Header row: label + mic status */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] font-bold tracking-widest uppercase text-purple-300">
                  Record
                </p>
                {recording.isMicReady && !recording.isRecording && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Mic ready
                    </span>
                    <button
                      onClick={recording.releaseMicrophone}
                      className="text-[11px] text-gray-400 border border-gray-200 rounded-md px-2 py-0.5 hover:text-gray-600 hover:border-gray-300 transition"
                    >
                      Turn off
                    </button>
                  </div>
                )}
                {recording.isRecording && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    Recording…
                  </span>
                )}
              </div>

              <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                <p className="mt-0.5 text-[10px] text-amber-600">
                  Recording auto-stops at 35 sec.
                </p>
              </div>

              {/* Hidden audio element for recorded voice playback */}
              <audio
                ref={myVoiceRef}
                src={recording.recordedAudioUrl ?? undefined}
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
                  onClick={handleRecordClick}
                  disabled={loading}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-white transition hover:scale-105 disabled:opacity-50 ${
                    recording.isRecording
                      ? "bg-linear-to-r from-red-400 to-red-500"
                      : "bg-linear-to-r from-pink-300 to-violet-400"
                  }`}
                >
                  {recording.isRecording ? (
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
                  disabled={
                    loading ||
                    recording.isRecording ||
                    !recording.audioFile ||
                    scored
                  }
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
                {recording.recordedAudioUrl && (
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

                          const audio = myVoiceRef.current;
                          if (!audio) return;

                          audio.currentTime = t;
                          void audio.play();
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
          )}

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
                            onClick={() => toggleWord(index)}
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

            {/* ── Sheet: phrases view ── */}
            {catTpl.sheetView === "phrases" && (
              <>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                  <div>
                    <p className="text-base font-black text-gray-800">
                      {selectedCategory
                        ? `${getCategoryIcon(selectedCategory.categoryKey)} ${selectedCategory.displayName}`
                        : "Select a phrase"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {catTpl.filteredTemplates.length} phrase
                      {catTpl.filteredTemplates.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => catTpl.openNewTemplateForm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border border-purple-200 bg-purple-50 text-purple-500 transition"
                    >
                      + New
                    </button>
                    <button
                      onClick={() => catTpl.setFavoritesOnly((v) => !v)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                        catTpl.favoritesOnly
                          ? "bg-amber-50 border-amber-300 text-amber-600"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      {catTpl.favoritesOnly ? "★" : "☆"} Fav
                    </button>
                    <button
                      onClick={() => setSheetOpen(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3 pb-8">
                  {catTpl.templateLoading ? (
                    <p className="text-sm text-gray-400">
                      Loading catTpl.templates...
                    </p>
                  ) : catTpl.filteredTemplates.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      {catTpl.favoritesOnly
                        ? "No catTpl.favorites yet."
                        : "No catTpl.templates yet."}
                    </p>
                  ) : (
                    catTpl.filteredTemplates.map((template) => {
                      const isSelected =
                        catTpl.selectedTemplateId === template.id;
                      const isFav = catTpl.favorites.has(template.id);
                      const diff = template.difficulty?.toLowerCase() ?? "";
                      const diffBadge =
                        diff === "easy"
                          ? "bg-emerald-50 text-emerald-700"
                          : diff === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : diff === "hard"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-500";
                      const diffLabel =
                        diff.charAt(0).toUpperCase() + diff.slice(1) || "—";
                      const lastScore = catTpl.templateLatestScores.get(
                        template.id,
                      );
                      const dotColor =
                        lastScore == null
                          ? "bg-gray-200"
                          : lastScore >= 80
                            ? "bg-emerald-400"
                            : lastScore >= 60
                              ? "bg-amber-400"
                              : "bg-red-400";

                      return (
                        <div
                          key={template.id}
                          className={`relative w-full rounded-2xl border-2 transition ${
                            isSelected
                              ? "border-purple-300 bg-linear-to-br from-purple-50 to-blue-50"
                              : "border-gray-100 bg-gray-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectTemplate(template)}
                            className="w-full px-4 py-3.5 text-left pr-20"
                          >
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
                            </div>
                            <p className="text-sm font-semibold text-gray-700 leading-snug mb-2">
                              {template.displayText}
                            </p>
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
                                  className={`text-[11px] font-bold ${lastScore >= 80 ? "text-emerald-600" : lastScore >= 60 ? "text-amber-500" : "text-red-500"}`}
                                >
                                  Last: {lastScore}
                                </span>
                              )}
                            </div>
                          </button>
                          {/* Star - always visible, outside select button */}
                          <button
                            type="button"
                            onClick={(e) =>
                              handleToggleFavorite(template.id, e)
                            }
                            className={`absolute top-3 right-10 text-sm transition hover:scale-125 ${isFav ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}
                          >
                            {isFav ? "★" : "☆"}
                          </button>
                          {/* Edit button */}
                          <button
                            type="button"
                            aria-label="Edit phrase"
                            onClick={() =>
                              catTpl.openEditTemplateForm(template, true)
                            }
                            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs"
                          >
                            ✎
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ── Sheet: catTpl.categories view ── */}
            {catTpl.sheetView === "categories" && (
              <>
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                  <p className="text-base font-black text-gray-800">
                    Categories
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => catTpl.openNewCategoryForm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border border-purple-200 bg-purple-50 text-purple-500 transition"
                    >
                      + New
                    </button>
                    <button
                      onClick={() => setSheetOpen(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-col gap-2 pb-8">
                  {catTpl.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        onClick={() => {
                          catTpl.selectCategory(cat.id);
                          catTpl.setSheetView("phrases");
                        }}
                      >
                        <span className="text-xl w-6 text-center shrink-0">
                          {getCategoryIcon(cat.categoryKey)}
                        </span>
                        <span className="text-sm font-bold text-gray-700 truncate flex-1">
                          {cat.displayName}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${cat.displayName}`}
                        onClick={() => catTpl.openEditCategoryForm(cat, true)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs shrink-0"
                      >
                        ✎
                      </button>{" "}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Sheet: phrase-form view ── */}
            {catTpl.sheetView === "phrase-form" && (
              <>
                <div className="flex items-center gap-3 px-5 pb-3 border-b border-gray-100">
                  <button
                    onClick={() => catTpl.setSheetView("phrases")}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0"
                  >
                    ←
                  </button>
                  <p className="text-base font-black text-gray-800">
                    {catTpl.editingTemplateId ? "Edit phrase" : "New phrase"}
                  </p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3 pb-8">
                  {/* Category chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {catTpl.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            catTpl.setTemplateFormCategoryId(cat.id)
                          }
                          className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold transition ${
                            catTpl.templateFormCategoryId === cat.id
                              ? "border-purple-300 bg-purple-50 text-purple-700"
                              : "border-gray-100 bg-gray-50 text-gray-500"
                          }`}
                        >
                          {getCategoryIcon(cat.categoryKey)} {cat.displayName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Title
                    </label>
                    <input
                      type="text"
                      value={catTpl.templateFormTitle}
                      onChange={(e) =>
                        catTpl.setTemplateFormTitle(e.target.value)
                      }
                      placeholder="e.g. Why Australia"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                    />
                  </div>

                  {/* Phrase text */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Phrase text
                    </label>
                    <textarea
                      value={catTpl.templateFormText}
                      onChange={(e) =>
                        catTpl.setTemplateFormText(e.target.value)
                      }
                      placeholder="e.g. I've always wanted to..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            catTpl.setTemplateFormDifficulty(
                              catTpl.templateFormDifficulty === d ? "" : d,
                            )
                          }
                          className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold transition ${
                            catTpl.templateFormDifficulty === d
                              ? d === "easy"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : d === "medium"
                                  ? "border-amber-300 bg-amber-50 text-amber-700"
                                  : "border-red-300 bg-red-50 text-red-700"
                              : "border-gray-100 bg-gray-50 text-gray-500"
                          }`}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => catTpl.setSheetView("phrases")}
                      className="flex-1 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold py-3 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={catTpl.handleSaveTemplate}
                      disabled={!catTpl.templateFormText.trim()}
                      className="flex-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-bold py-3 transition"
                    >
                      Save
                    </button>
                  </div>

                  {catTpl.editingTemplateId && (
                    <button
                      type="button"
                      onClick={() =>
                        catTpl.handleDeleteTemplate(catTpl.editingTemplateId!)
                      }
                      className="w-full rounded-xl border border-red-200 text-red-400 text-sm font-bold py-2.5 transition"
                    >
                      Delete phrase
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── Sheet: category-form view ── */}
            {catTpl.sheetView === "category-form" && (
              <>
                <div className="flex items-center gap-3 px-5 pb-3 border-b border-gray-100">
                  <button
                    onClick={() => catTpl.setSheetView("categories")}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0"
                  >
                    ←
                  </button>
                  <p className="text-base font-black text-gray-800">
                    {catTpl.editingCategoryId
                      ? "Edit category"
                      : "New category"}
                  </p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3 pb-8">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Name
                    </label>
                    <input
                      type="text"
                      value={catTpl.categoryFormName}
                      onChange={(e) =>
                        catTpl.setCategoryFormName(e.target.value)
                      }
                      placeholder="e.g. Business"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={catTpl.categoryFormDesc}
                      onChange={(e) =>
                        catTpl.setCategoryFormDesc(e.target.value)
                      }
                      placeholder="Short description"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={catTpl.handleSaveCategory}
                    disabled={!catTpl.categoryFormName.trim()}
                    className="w-full rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-bold py-3 transition"
                  >
                    {catTpl.editingCategoryId
                      ? "Save changes"
                      : "Create category"}
                  </button>
                  {catTpl.editingCategoryId && (
                    <button
                      type="button"
                      onClick={() =>
                        catTpl.handleDeleteCategory(catTpl.editingCategoryId!)
                      }
                      className="w-full rounded-xl border border-red-200 text-red-400 hover:bg-red-50 text-sm font-bold py-2.5 transition"
                    >
                      Delete category
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* ── Toast: template moved ── */}
      {catTpl.templateMovedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-800 text-white text-sm font-semibold shadow-lg whitespace-nowrap">
          {catTpl.templateMovedToast}
        </div>
      )}
    </div>
  );
}
