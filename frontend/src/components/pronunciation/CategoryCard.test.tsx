import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SentenceCategory } from "@/lib/api/sentenceTemplates";
import { CategoryCard, type CategoryCardVariant } from "./CategoryCard";

// Same intent as TemplateCard.test.tsx: that each button reaches the handler it
// is meant to, and that each variant renders the affordances it should. Layout,
// hover and breakpoints are not covered — those still need a browser.

const baseCategory: SentenceCategory = {
  id: "cat-1",
  categoryKey: "daily",
  displayName: "Daily Chat",
  description: "Everyday conversation",
  sortOrder: 0,
  userCategory: true,
};

type Overrides = {
  category?: Partial<SentenceCategory>;
  variant?: CategoryCardVariant;
};

function renderCard(overrides: Overrides = {}) {
  const onSelect = vi.fn();
  const onEdit = vi.fn();
  const { container } = render(
    <CategoryCard
      category={{ ...baseCategory, ...overrides.category }}
      variant={overrides.variant ?? "sidebar"}
      onSelect={onSelect}
      onEdit={onEdit}
    />,
  );
  const root = container.firstElementChild as HTMLElement;
  return { root, onSelect, onEdit };
}

describe("CategoryCard — handler wiring", () => {
  it("fires onSelect (and NOT onEdit) when the category is clicked", async () => {
    const user = userEvent.setup();
    const { onSelect, onEdit } = renderCard();

    await user.click(screen.getByText("Daily Chat"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("fires onEdit (and NOT onSelect) when the edit button is clicked", async () => {
    // Edit sits inside the row; without the click being contained, editing a
    // category would also navigate away into its phrase list.
    const user = userEvent.setup();
    const { onSelect, onEdit } = renderCard();

    await user.click(screen.getByRole("button", { name: "Edit Daily Chat" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders the icon for the category key", () => {
    renderCard({ category: { categoryKey: "tech" } });
    expect(screen.getByText("💻")).toBeInTheDocument();
  });

  it("falls back to the default icon for an unknown key", () => {
    renderCard({ category: { categoryKey: null } });
    expect(screen.getByText("📘")).toBeInTheDocument();
  });
});

describe("CategoryCard — variant affordances", () => {
  it("sidebar shows the description and the drill-in chevron", () => {
    renderCard({ variant: "sidebar" });
    expect(screen.getByText("Everyday conversation")).toBeInTheDocument();
    expect(screen.getByText("›")).toBeInTheDocument();
  });

  it("sheet hides the description and the chevron", () => {
    renderCard({ variant: "sheet" });
    expect(screen.queryByText("Everyday conversation")).not.toBeInTheDocument();
    expect(screen.queryByText("›")).not.toBeInTheDocument();
  });

  it("sidebar reveals the edit button on hover (group + group-hover)", () => {
    const { root } = renderCard({ variant: "sidebar" });
    expect(root).toHaveClass("group");
    expect(screen.getByRole("button", { name: "Edit Daily Chat" })).toHaveClass(
      "group-hover:opacity-100",
    );
  });

  it("sheet always shows the edit button (no hover on touch)", () => {
    const { root } = renderCard({ variant: "sheet" });
    expect(root).not.toHaveClass("group");
    expect(
      screen.getByRole("button", { name: "Edit Daily Chat" }),
    ).not.toHaveClass("group-hover:opacity-100");
  });

  it("omits the description when the category has none", () => {
    renderCard({ variant: "sidebar", category: { description: null } });
    expect(screen.queryByText("Everyday conversation")).not.toBeInTheDocument();
    // The name is still shown.
    expect(screen.getByText("Daily Chat")).toBeInTheDocument();
  });
});

describe("CategoryCard — seed categories are read-only", () => {
  it("hides the edit button when the user does not own the category", () => {
    renderCard({ category: { userCategory: false } });
    expect(
      screen.queryByRole("button", { name: "Edit Daily Chat" }),
    ).not.toBeInTheDocument();
  });

  it("still allows drilling into a seed category", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCard({ category: { userCategory: false } });

    await user.click(screen.getByText("Daily Chat"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
