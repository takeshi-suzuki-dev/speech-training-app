import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SentenceTemplate } from "@/lib/api/sentenceTemplates";
import { TemplateCard, type TemplateCardVariant } from "./TemplateCard";

// A card is presentational, so a test only needs a plausible template plus spy
// callbacks. These smoke tests guard the parts tsc/eslint can't: which button
// is wired to which handler (re-pointed during the sidebar/sheet dedup), the
// per-variant class output, and the difficulty/score display thresholds.
// They do NOT cover layout, hover, or breakpoints — verify those in the browser.

const baseTemplate: SentenceTemplate = {
  id: "tpl-1",
  categoryId: "cat-1",
  templateKey: null,
  title: "Greeting",
  displayText: "Hello, how are you?",
  scoringText: "hello how are you",
  sampleAudioText: "Hello, how are you?",
  difficulty: "easy",
  sortOrder: 0,
};

type Overrides = {
  template?: Partial<SentenceTemplate>;
  variant?: TemplateCardVariant;
  isSelected?: boolean;
  isFavorite?: boolean;
  lastScore?: number | null;
};

function renderCard(overrides: Overrides = {}) {
  const onSelect = vi.fn();
  const onToggleFavorite = vi.fn();
  const onEdit = vi.fn();
  const { container } = render(
    <TemplateCard
      template={{ ...baseTemplate, ...overrides.template }}
      variant={overrides.variant ?? "sidebar"}
      isSelected={overrides.isSelected ?? false}
      isFavorite={overrides.isFavorite ?? false}
      lastScore={overrides.lastScore ?? null}
      onSelect={onSelect}
      onToggleFavorite={onToggleFavorite}
      onEdit={onEdit}
    />,
  );
  // The card renders a single root <div>.
  const root = container.firstElementChild as HTMLElement;
  return { root, onSelect, onToggleFavorite, onEdit };
}

describe("TemplateCard — handler wiring", () => {
  it("fires onSelect (and nothing else) when the phrase button is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect, onToggleFavorite, onEdit } = renderCard();

    await user.click(screen.getByText("Hello, how are you?"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("fires onToggleFavorite (and NOT onSelect) when the star is clicked", async () => {
    // Regression guard: the star is a sibling of the select button, so clicking
    // it must never also select the card.
    const user = userEvent.setup();
    const { onSelect, onToggleFavorite } = renderCard({ isFavorite: false });

    await user.click(screen.getByRole("button", { name: "☆" }));

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("fires onEdit (and NOT onSelect) when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect, onEdit } = renderCard();

    await user.click(screen.getByRole("button", { name: "Edit phrase" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a filled star when favorited", () => {
    renderCard({ isFavorite: true });
    expect(screen.getByRole("button", { name: "★" })).toBeInTheDocument();
  });
});

describe("TemplateCard — variant styling", () => {
  it("sidebar uses rounded-xl + group (hover-revealed edit)", () => {
    const { root } = renderCard({ variant: "sidebar" });
    expect(root).toHaveClass("rounded-xl", "group");
    const edit = screen.getByRole("button", { name: "Edit phrase" });
    // Sidebar edit is revealed on hover.
    expect(edit).toHaveClass("group-hover:opacity-100");
  });

  it("sheet uses rounded-2xl, no group (always-visible edit)", () => {
    const { root } = renderCard({ variant: "sheet" });
    expect(root).toHaveClass("rounded-2xl");
    expect(root).not.toHaveClass("group");
    const edit = screen.getByRole("button", { name: "Edit phrase" });
    // Sheet edit is always visible (no hover on touch).
    expect(edit).not.toHaveClass("group-hover:opacity-100");
  });

  it("applies the selected treatment when isSelected", () => {
    const { root } = renderCard({ isSelected: true });
    expect(root).toHaveClass("border-purple-300");
  });
});

describe("TemplateCard — difficulty + score display", () => {
  it('renders a capitalized difficulty label ("easy" -> "Easy")', () => {
    renderCard({ template: { difficulty: "easy" } });
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it('renders "—" when difficulty is empty', () => {
    renderCard({ template: { difficulty: "" } });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it('shows "Not tried yet" when there is no score', () => {
    renderCard({ lastScore: null });
    expect(screen.getByText("Not tried yet")).toBeInTheDocument();
  });

  it("shows the score and green text at/above 80", () => {
    renderCard({ lastScore: 85 });
    const label = screen.getByText("Last: 85");
    expect(label).toHaveClass("text-emerald-600");
  });

  it("uses amber text in the 60–79 band", () => {
    renderCard({ lastScore: 65 });
    expect(screen.getByText("Last: 65")).toHaveClass("text-amber-500");
  });

  it("uses red text below 60", () => {
    renderCard({ lastScore: 40 });
    expect(screen.getByText("Last: 40")).toHaveClass("text-red-500");
  });
});
