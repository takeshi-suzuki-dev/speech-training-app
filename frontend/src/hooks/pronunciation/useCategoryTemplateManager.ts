"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  fetchLatestAssessmentResultsBySentence,
  TrainingAttemptResult,
} from "@/lib/api/assessmentResults";
import {
  createSentenceCategory,
  createSentenceTemplate,
  deleteSentenceCategory,
  deleteSentenceTemplate,
  fetchSentenceCategories,
  fetchSentenceTemplates,
  SentenceCategory,
  SentenceTemplate,
  updateSentenceCategory,
  updateSentenceTemplate,
} from "@/lib/api/sentenceTemplates";
import {
  addTemplateFavorite,
  fetchFavoriteTemplateIds,
  removeTemplateFavorite,
} from "@/lib/api/templateFavorites";

export type SidebarView = "categories" | "phrases" | "category-form" | "phrase-form";

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

const upsertCategory = (
  items: SentenceCategory[],
  category: SentenceCategory,
): SentenceCategory[] => {
  const exists = items.some((item) => item.id === category.id);

  const nextItems = exists
    ? items.map((item) => (item.id === category.id ? category : item))
    : [...items, category];

  return nextItems.sort((a, b) => a.sortOrder - b.sortOrder);
};

// These two strings were previously duplicated across ~8 separate
// `setReferenceText(...)` call sites throughout the component, each of
// which had to be kept manually in sync with `selectedTemplateId`. That
// duplication was the likely root cause of at least one hard-to-reproduce
// selection bug (a stale sentence showing after switching categories). Here,
// `referenceText` is a single derived value instead — see the bottom of this
// hook — so there is exactly one place that can get it wrong.
const NO_CATEGORY_TEXT = "Select a category to get started.";
const NO_TEMPLATE_TEXT = "Select a practice sentence to get started.";

type UseCategoryTemplateManagerArgs = {
  // These three stay owned by the sample-audio/recording part of the page;
  // this hook only calls them at the right moments, matching the original
  // component's behavior exactly.
  resetSampleAudioState: () => void;
  removeCachedAudioForTemplate: (templateId: string) => void;
  reportError: (message: string) => void;
};

export function useCategoryTemplateManager({
  resetSampleAudioState,
  removeCachedAudioForTemplate,
  reportError,
}: UseCategoryTemplateManagerArgs) {
  // Injected callbacks are read through refs inside effects so they don't
  // have to sit in effect dependency arrays. If they did, an unstable
  // callback from the parent (not wrapped in useCallback) would re-run the
  // template-loading effect on every parent render, refetching templates
  // and resetting the sample audio for no reason.
  const resetSampleAudioStateRef = useRef(resetSampleAudioState);
  const removeCachedAudioForTemplateRef = useRef(removeCachedAudioForTemplate);
  const reportErrorRef = useRef(reportError);

  useEffect(() => {
    resetSampleAudioStateRef.current = resetSampleAudioState;
    removeCachedAudioForTemplateRef.current = removeCachedAudioForTemplate;
    reportErrorRef.current = reportError;
  });
  const [categories, setCategories] = useState<SentenceCategory[]>([]);
  const [templates, setTemplates] = useState<SentenceTemplate[]>([]);
  const [templateLatestScores, setTemplateLatestScores] = useState<
    Map<string, number>
  >(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const [sidebarView, setSidebarView] = useState<SidebarView>("categories");
  const [sheetView, setSheetView] = useState<SidebarView>("phrases");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryFormDesc, setCategoryFormDesc] = useState("");

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateFormCategoryId, setTemplateFormCategoryId] = useState<
    string | null
  >(null);
  const [templateFormTitle, setTemplateFormTitle] = useState("");
  const [templateFormText, setTemplateFormText] = useState("");
  const [templateFormDifficulty, setTemplateFormDifficulty] = useState<
    "easy" | "medium" | "hard" | ""
  >("");

  const [templateMovedToast, setTemplateMovedToast] = useState<string | null>(
    null,
  );

  const pendingTemplateSelectRef = useRef<string | null>(null);
  const templateMovedToastTimerRef = useRef<number | null>(null);

  // ── Initial + session-scoped data loading ──────────────────
  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);
        reportErrorRef.current("");

        const data = await fetchSentenceCategories();

        if (ignore) {
          return;
        }

        setCategories(data);

        setSelectedCategoryId((currentId) => {
          if (currentId && data.some((category) => category.id === currentId)) {
            return currentId;
          }

          return data[0]?.id ?? null;
        });
      } catch (error) {
        if (!ignore) {
          reportErrorRef.current(
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

    const unsubscribe = onAuthStateChanged(auth, () => {
      void loadCategories();
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!ignore) {
          setFavorites(new Set());
        }
        return;
      }

      try {
        const favoriteIds = await fetchFavoriteTemplateIds();

        if (ignore) {
          return;
        }

        setFavorites(new Set(favoriteIds));
      } catch (error) {
        console.error(error);
      }
    });

    return () => {
      ignore = true;
      unsubscribe();
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

  const refreshLatestScores = async () => {
    try {
      const attempts = await fetchLatestAssessmentResultsBySentence();
      setTemplateLatestScores(buildTemplateLatestScores(attempts));
    } catch (error) {
      console.error(error);
    }
  };

  // ── Load templates whenever the selected category changes ──
  useEffect(() => {
    if (!selectedCategoryId) {
      pendingTemplateSelectRef.current = null;
      setTemplates([]);
      setSelectedTemplateId(null);
      resetSampleAudioStateRef.current();
      return;
    }

    let ignore = false;

    const loadTemplates = async () => {
      try {
        setTemplateLoading(true);
        reportErrorRef.current("");

        const data = await fetchSentenceTemplates(selectedCategoryId);

        if (ignore) {
          return;
        }

        setTemplates(data);

        const pendingTemplateId = pendingTemplateSelectRef.current;
        const pendingTemplate = pendingTemplateId
          ? (data.find((template) => template.id === pendingTemplateId) ?? null)
          : null;

        pendingTemplateSelectRef.current = null;

        const nextTemplate = pendingTemplate ?? data[0] ?? null;
        setSelectedTemplateId(nextTemplate?.id ?? null);

        resetSampleAudioStateRef.current();
      } catch (error) {
        if (!ignore) {
          reportErrorRef.current(
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

  // ── Selection ────────────────────────────────────────────────
  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const selectTemplate = (template: SentenceTemplate) => {
    setSelectedTemplateId(template.id);
    resetSampleAudioStateRef.current();
  };

  const toggleFavorite = async (templateId: string) => {
    const wasFavorite = favorites.has(templateId);

    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasFavorite) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });

    try {
      if (wasFavorite) {
        await removeTemplateFavorite(templateId);
      } else {
        await addTemplateFavorite(templateId);
      }
    } catch (error) {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.add(templateId);
        } else {
          next.delete(templateId);
        }
        return next;
      });

      reportErrorRef.current(
        error instanceof Error ? error.message : "Failed to update favorite.",
      );
    }
  };

  // ── Category CRUD ────────────────────────────────────────────
  const openNewCategoryForm = (isMobile: boolean) => {
    setEditingCategoryId(null);
    setCategoryFormName("");
    setCategoryFormDesc("");
    if (isMobile) {
      setSheetView("category-form");
    } else {
      setSidebarView("category-form");
    }
  };

  const openEditCategoryForm = (cat: SentenceCategory, isMobile: boolean) => {
    setEditingCategoryId(cat.id);
    setCategoryFormName(cat.displayName);
    setCategoryFormDesc(cat.description ?? "");
    if (isMobile) {
      setSheetView("category-form");
    } else {
      setSidebarView("category-form");
    }
  };

  const handleSaveCategory = async () => {
    const name = categoryFormName.trim();

    if (!name) {
      return;
    }

    const request = {
      displayName: name,
      description: categoryFormDesc.trim() || null,
    };

    try {
      reportErrorRef.current("");

      const isEditing = Boolean(editingCategoryId);

      const savedCategory = editingCategoryId
        ? await updateSentenceCategory(editingCategoryId, request)
        : await createSentenceCategory(request);

      const fetchedCategories = await fetchSentenceCategories();
      const nextCategories = upsertCategory(fetchedCategories, savedCategory);

      setCategories(nextCategories);

      if (isEditing) {
        setSelectedCategoryId((currentId) => currentId ?? savedCategory.id);
      } else {
        setSelectedCategoryId(savedCategory.id);
        setTemplates([]);
        setSelectedTemplateId(null);
      }

      setSidebarView("categories");
      setSheetView("categories");
      setEditingCategoryId(null);
    } catch (error) {
      reportErrorRef.current(
        error instanceof Error ? error.message : "Failed to save category.",
      );
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const ok = window.confirm(
      "Delete this category?\n\nAll practice sentences in this category will also be deleted.\nThis action cannot be undone.",
    );

    if (!ok) {
      return;
    }

    try {
      reportErrorRef.current("");

      await deleteSentenceCategory(catId);

      const nextCategories = await fetchSentenceCategories();
      setCategories(nextCategories);

      // Deleting the selected category always unselects both category and
      // sentence, regardless of position in the list (see delete-behavior
      // docs — this was previously position-dependent next/previous
      // fallback logic, which turned out not to match the intended design).
      if (selectedCategoryId === catId) {
        setSelectedCategoryId(null);
        setTemplates([]);
        setSelectedTemplateId(null);
      }

      setSidebarView("categories");
      setSheetView("categories");
      setEditingCategoryId(null);
    } catch (error) {
      reportErrorRef.current(
        error instanceof Error ? error.message : "Failed to delete category.",
      );
    }
  };

  // ── Template CRUD ────────────────────────────────────────────
  const openNewTemplateForm = (isMobile: boolean) => {
    setEditingTemplateId(null);
    setTemplateFormCategoryId(selectedCategoryId);
    setTemplateFormTitle("");
    setTemplateFormText("");
    setTemplateFormDifficulty("");
    if (isMobile) {
      setSheetView("phrase-form");
    } else {
      setSidebarView("phrase-form");
    }
  };

  const openEditTemplateForm = (
    template: SentenceTemplate,
    isMobile: boolean,
  ) => {
    setEditingTemplateId(template.id);
    setTemplateFormCategoryId(template.categoryId);
    setTemplateFormTitle(template.title ?? "");
    setTemplateFormText(template.displayText);
    setTemplateFormDifficulty(
      (template.difficulty?.toLowerCase() as "easy" | "medium" | "hard") ?? "",
    );
    if (isMobile) {
      setSheetView("phrase-form");
    } else {
      setSidebarView("phrase-form");
    }
  };

  const showTemplateMovedToast = (message: string) => {
    if (templateMovedToastTimerRef.current) {
      window.clearTimeout(templateMovedToastTimerRef.current);
    }

    setTemplateMovedToast(message);

    templateMovedToastTimerRef.current = window.setTimeout(() => {
      setTemplateMovedToast(null);
      templateMovedToastTimerRef.current = null;
    }, 2500);
  };

  const handleSaveTemplate = async () => {
    const text = templateFormText.trim();

    if (!text) {
      return;
    }

    const destCategoryId = templateFormCategoryId ?? selectedCategoryId;

    if (!destCategoryId) {
      reportErrorRef.current("Please select a category.");
      return;
    }

    const title = templateFormTitle.trim();
    const difficulty = templateFormDifficulty || "easy";

    const request = {
      categoryId: destCategoryId,
      title,
      displayText: text,
      scoringText: text,
      sampleAudioText: text,
      difficulty,
    };

    try {
      reportErrorRef.current("");

      const savedTemplate = editingTemplateId
        ? await updateSentenceTemplate(editingTemplateId, request)
        : await createSentenceTemplate(request);

      if (editingTemplateId) {
        removeCachedAudioForTemplateRef.current(editingTemplateId);
      }

      const movedToAnotherCategory = selectedCategoryId !== destCategoryId;

      if (movedToAnotherCategory) {
        pendingTemplateSelectRef.current = savedTemplate.id;
        setSelectedCategoryId(destCategoryId);
        resetSampleAudioStateRef.current();
        showTemplateMovedToast("Practice sentence moved to another category.");
      } else {
        const nextTemplates = await fetchSentenceTemplates(destCategoryId);
        setTemplates(nextTemplates);

        const nextSavedTemplate =
          nextTemplates.find((template) => template.id === savedTemplate.id) ??
          savedTemplate;

        if (!editingTemplateId || selectedTemplateId === editingTemplateId) {
          setSelectedTemplateId(nextSavedTemplate.id);
          resetSampleAudioStateRef.current();
        }
      }

      setSidebarView("phrases");
      setSheetView("phrases");
      setEditingTemplateId(null);
    } catch (error) {
      reportErrorRef.current(
        error instanceof Error
          ? error.message
          : "Failed to save practice sentence.",
      );
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const ok = window.confirm(
      "Delete this practice sentence?\n\nThe sample audio file for this sentence will also be deleted.\nYour past practice history will remain.",
    );

    if (!ok) {
      return;
    }

    try {
      reportErrorRef.current("");

      // Resolve the fallback template (next, else previous, else none) from
      // the list order *before* deletion.
      const deletedIndex = templates.findIndex((t) => t.id === templateId);
      const fallbackTemplateId =
        (deletedIndex >= 0 ? templates[deletedIndex + 1]?.id : undefined) ??
        (deletedIndex >= 0 ? templates[deletedIndex - 1]?.id : undefined) ??
        null;

      await deleteSentenceTemplate(templateId);

      removeCachedAudioForTemplateRef.current(templateId);

      if (selectedCategoryId) {
        const nextTemplates = await fetchSentenceTemplates(selectedCategoryId);
        setTemplates(nextTemplates);

        if (selectedTemplateId === templateId) {
          const nextTemplate = fallbackTemplateId
            ? (nextTemplates.find((t) => t.id === fallbackTemplateId) ?? null)
            : null;
          setSelectedTemplateId(nextTemplate?.id ?? null);
        }
      }

      setSidebarView("phrases");
      setSheetView("phrases");
      setEditingTemplateId(null);
    } catch (error) {
      reportErrorRef.current(
        error instanceof Error
          ? error.message
          : "Failed to delete practice sentence.",
      );
    }
  };

  // ── Derived ──────────────────────────────────────────────────
  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? null;

  // The single source of truth for the displayed sentence text. See the
  // comment near NO_CATEGORY_TEXT/NO_TEMPLATE_TEXT above for why this
  // replaced ~8 separate setReferenceText(...) call sites.
  const referenceText = selectedTemplate
    ? selectedTemplate.displayText
    : selectedCategoryId
      ? NO_TEMPLATE_TEXT
      : NO_CATEGORY_TEXT;

  const filteredTemplates = favoritesOnly
    ? templates.filter((t) => favorites.has(t.id))
    : templates;

  return {
    // Data
    categories,
    templates,
    filteredTemplates,
    templateLatestScores,
    refreshLatestScores,
    favorites,
    favoritesOnly,
    setFavoritesOnly,
    categoryLoading,
    templateLoading,

    // Selection
    selectedCategoryId,
    selectedTemplateId,
    selectedTemplate,
    referenceText,
    selectCategory,
    selectTemplate,
    toggleFavorite,

    // View state
    sidebarView,
    setSidebarView,
    sheetView,
    setSheetView,

    // Category form
    editingCategoryId,
    categoryFormName,
    setCategoryFormName,
    categoryFormDesc,
    setCategoryFormDesc,
    openNewCategoryForm,
    openEditCategoryForm,
    handleSaveCategory,
    handleDeleteCategory,

    // Template form
    editingTemplateId,
    templateFormCategoryId,
    setTemplateFormCategoryId,
    templateFormTitle,
    setTemplateFormTitle,
    templateFormText,
    setTemplateFormText,
    templateFormDifficulty,
    setTemplateFormDifficulty,
    openNewTemplateForm,
    openEditTemplateForm,
    handleSaveTemplate,
    handleDeleteTemplate,

    // Toast
    templateMovedToast,
  };
}
