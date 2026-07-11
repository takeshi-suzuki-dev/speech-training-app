import { SentenceCategory } from "@/lib/api/sentenceTemplates";
import { getCategoryIcon } from "@/lib/pronunciation/categoryIcon";

/**
 * Which surface the card renders on. Mirrors TemplateCard: both layouts are
 * kept intentionally, and the variant only selects styling/affordances that
 * were previously duplicated between the desktop sidebar and the mobile sheet.
 *
 * Note the two variants are not pure style twins — the sidebar additionally
 * shows the category description and a drill-in chevron, and reveals its edit
 * button on hover (there is no hover on touch, so the sheet shows it always).
 * Those differences are declared in VARIANT_CONFIG rather than left to the
 * call sites.
 */
export type CategoryCardVariant = "sidebar" | "sheet";

type CategoryCardProps = {
  category: SentenceCategory;
  variant: CategoryCardVariant;
  /** Drill into this category's phrase list. */
  onSelect: () => void;
  /** Open the edit form for this category. */
  onEdit: () => void;
};

const VARIANT_CONFIG: Record<
  CategoryCardVariant,
  {
    container: string;
    icon: string;
    edit: string;
    /** Sidebar shows the description under the name; the sheet does not. */
    showDescription: boolean;
    /** Sidebar shows a "›" drill-in affordance; the sheet does not. */
    showChevron: boolean;
  }
> = {
  sidebar: {
    container:
      "group flex w-full items-center gap-3 rounded-xl border-2 border-transparent px-3 py-2.5 transition hover:border-purple-100 hover:bg-purple-50",
    icon: "text-xl w-7 text-center shrink-0",
    edit: "opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs shrink-0",
    showDescription: true,
    showChevron: true,
  },
  sheet: {
    container:
      "flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3",
    icon: "text-xl w-6 text-center shrink-0",
    edit: "w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-purple-400 hover:bg-purple-100 transition text-xs shrink-0",
    showDescription: false,
    showChevron: false,
  },
};

/**
 * A single selectable category row, shared by the desktop sidebar and the
 * mobile bottom sheet. Presentational: all state and side effects are owned by
 * the caller and passed in as props.
 */
export function CategoryCard({
  category,
  variant,
  onSelect,
  onEdit,
}: CategoryCardProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div className={config.container}>
      <button
        type="button"
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={onSelect}
      >
        <span className={config.icon}>
          {getCategoryIcon(category.categoryKey)}
        </span>
        {config.showDescription ? (
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-gray-700 truncate">
              {category.displayName}
            </span>
            {category.description && (
              <span className="block text-[11px] text-gray-400 truncate">
                {category.description}
              </span>
            )}
          </span>
        ) : (
          <span className="text-sm font-bold text-gray-700 truncate flex-1">
            {category.displayName}
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label={`Edit ${category.displayName}`}
        onClick={onEdit}
        className={config.edit}
      >
        ✎
      </button>
      {config.showChevron && (
        <span className="text-purple-300 text-base transition group-hover:translate-x-0.5 group-hover:text-purple-400 shrink-0">
          ›
        </span>
      )}
    </div>
  );
}
