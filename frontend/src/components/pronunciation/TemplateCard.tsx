import type { MouseEvent } from "react";
import { SentenceTemplate } from "@/lib/api/sentenceTemplates";

/**
 * Which surface the card renders on. Both layouts are kept intentionally
 * (mobile is used going forward); this only selects the per-variant styling
 * that used to be duplicated between the desktop sidebar and the mobile
 * bottom sheet. Structure, content, and behaviour are identical across
 * variants.
 */
export type TemplateCardVariant = "sidebar" | "sheet";

type TemplateCardProps = {
  template: SentenceTemplate;
  variant: TemplateCardVariant;
  isSelected: boolean;
  isFavorite: boolean;
  /** Latest score for this template; null/undefined => never attempted. */
  lastScore: number | null | undefined;
  /** Select this template as the active phrase. */
  onSelect: () => void;
  /** Toggle favorite. Receives the event so the caller can stopPropagation. */
  onToggleFavorite: (event: MouseEvent) => void;
  /** Open the edit form for this template. */
  onEdit: () => void;
};

// Per-variant class table. The only real differences between the sidebar and
// sheet cards are cosmetic (corner radius, padding, hover/shadow affordances,
// and the star/edit button positions). Everything else is shared below.
const VARIANT_STYLES: Record<
  TemplateCardVariant,
  {
    container: (isSelected: boolean) => string;
    selectButton: string;
    phraseText: string;
    scoreRow: string;
    star: string;
    edit: string;
  }
> = {
  sidebar: {
    container: (isSelected) =>
      `group relative w-full rounded-xl border-2 transition ${
        isSelected
          ? "border-purple-300 bg-linear-to-br from-purple-50 to-blue-50 shadow-sm"
          : "border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200"
      }`,
    selectButton: "w-full text-left px-3 py-3 pr-14",
    phraseText: "text-[13px] font-semibold text-gray-700 leading-snug",
    scoreRow: "flex items-center gap-1.5 mt-1.5",
    star: "absolute top-2.5 right-8 text-sm transition hover:scale-125",
    edit: "absolute top-2 right-1 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs",
  },
  sheet: {
    container: (isSelected) =>
      `relative w-full rounded-2xl border-2 transition ${
        isSelected
          ? "border-purple-300 bg-linear-to-br from-purple-50 to-blue-50"
          : "border-gray-100 bg-gray-50"
      }`,
    selectButton: "w-full px-4 py-3.5 text-left pr-20",
    phraseText: "text-sm font-semibold text-gray-700 leading-snug mb-2",
    scoreRow: "flex items-center gap-1.5",
    star: "absolute top-3 right-10 text-sm transition hover:scale-125",
    edit: "absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs",
  },
};

function difficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-50 text-emerald-700";
    case "medium":
      return "bg-amber-50 text-amber-600";
    case "hard":
      return "bg-red-50 text-red-600";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

function scoreDotClass(lastScore: number | null | undefined): string {
  if (lastScore == null) return "bg-gray-200";
  if (lastScore >= 80) return "bg-emerald-400";
  if (lastScore >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function scoreTextClass(lastScore: number): string {
  if (lastScore >= 80) return "text-emerald-600";
  if (lastScore >= 60) return "text-amber-500";
  return "text-red-500";
}

/**
 * A single selectable phrase card, shared by the desktop sidebar and the
 * mobile bottom sheet. Presentational: all state and side effects are owned by
 * the caller and passed in as props.
 */
export function TemplateCard({
  template,
  variant,
  isSelected,
  isFavorite,
  lastScore,
  onSelect,
  onToggleFavorite,
  onEdit,
}: TemplateCardProps) {
  const styles = VARIANT_STYLES[variant];
  const diff = template.difficulty?.toLowerCase() ?? "";
  const diffBadge = difficultyBadgeClass(diff);
  const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1) || "—";

  return (
    <div className={styles.container(isSelected)}>
      <button
        type="button"
        onClick={onSelect}
        className={styles.selectButton}
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
        <p className={styles.phraseText}>{template.displayText}</p>
        {/* Score row */}
        <div className={styles.scoreRow}>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${scoreDotClass(lastScore)}`}
          />
          {lastScore == null ? (
            <span className="text-[11px] font-bold text-gray-400">
              Not tried yet
            </span>
          ) : (
            <span className={`text-[11px] font-bold ${scoreTextClass(lastScore)}`}>
              Last: {lastScore}
            </span>
          )}
        </div>
      </button>
      {/* Star - always visible, outside select button */}
      <button
        type="button"
        onClick={onToggleFavorite}
        className={`${styles.star} ${
          isFavorite
            ? "text-amber-400"
            : "text-gray-300 hover:text-amber-300"
        }`}
      >
        {isFavorite ? "★" : "☆"}
      </button>
      {/* Edit */}
      <button
        type="button"
        aria-label="Edit phrase"
        onClick={onEdit}
        className={styles.edit}
      >
        ✎
      </button>
    </div>
  );
}
