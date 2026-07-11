/**
 * Emoji shown for a sentence category. Pure lookup, shared by the page headers
 * and the CategoryCard component (both layouts).
 */
export function getCategoryIcon(categoryKey: string | null): string {
  if (categoryKey === "daily") return "💬";
  if (categoryKey === "interview") return "🧑‍💼";
  if (categoryKey === "tech") return "💻";
  if (categoryKey === "portfolio") return "✨";
  return "📘";
}
