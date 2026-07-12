import { apiFetch } from "@/lib/api/apiFetch";

export type SentenceCategory = {
  id: string;
  categoryKey: string | null;
  displayName: string;
  description: string | null;
  sortOrder: number;
  userCategory: boolean;
};

export type SaveSentenceCategoryRequest = {
  displayName: string;
  description: string | null;
};

export type SentenceTemplate = {
  id: string;
  categoryId: string;
  templateKey: string | null;
  title: string;
  displayText: string;
  scoringText: string;
  sampleAudioText: string;
  difficulty: string;
  sortOrder: number;
  /**
   * True when the signed-in user owns this template. Seed templates are system
   * content with no owner and are read-only: the API rejects updates to them,
   * so the edit affordance is hidden. To change a seed phrase, create your own.
   */
  userTemplate: boolean;
};

export type SaveSentenceTemplateRequest = {
  categoryId: string;
  title: string;
  displayText: string;
  scoringText: string;
  sampleAudioText: string;
  difficulty: string;
};

export async function fetchSentenceCategories(): Promise<SentenceCategory[]> {
  const response = await apiFetch("/api/sentence-categories");

  if (!response.ok) {
    throw new Error("Failed to fetch sentence categories.");
  }

  return response.json();
}

export async function createSentenceCategory(
  request: SaveSentenceCategoryRequest,
): Promise<SentenceCategory> {
  const response = await apiFetch("/api/sentence-categories", {
    method: "POST",
    json: request,
  });

  if (!response.ok) {
    throw new Error("Failed to create category.");
  }

  return response.json();
}

export async function updateSentenceCategory(
  categoryId: string,
  request: SaveSentenceCategoryRequest,
): Promise<SentenceCategory> {
  const response = await apiFetch(`/api/sentence-categories/${categoryId}`, {
    method: "PUT",
    json: request,
  });

  if (!response.ok) {
    throw new Error("Failed to update category.");
  }

  return response.json();
}

export async function deleteSentenceCategory(
  categoryId: string,
): Promise<void> {
  const response = await apiFetch(`/api/sentence-categories/${categoryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete category.");
  }
}

export async function fetchSentenceTemplates(
  categoryId: string,
): Promise<SentenceTemplate[]> {
  const response = await apiFetch(
    `/api/sentence-templates?categoryId=${encodeURIComponent(categoryId)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sentence templates.");
  }

  return response.json();
}

export async function createSentenceTemplate(
  request: SaveSentenceTemplateRequest,
): Promise<SentenceTemplate> {
  const response = await apiFetch("/api/sentence-templates", {
    method: "POST",
    json: request,
  });

  if (!response.ok) {
    throw new Error("Failed to create practice sentence.");
  }

  return response.json();
}

export async function updateSentenceTemplate(
  templateId: string,
  request: SaveSentenceTemplateRequest,
): Promise<SentenceTemplate> {
  const response = await apiFetch(`/api/sentence-templates/${templateId}`, {
    method: "PUT",
    json: request,
  });

  if (!response.ok) {
    throw new Error("Failed to update practice sentence.");
  }

  return response.json();
}

export async function deleteSentenceTemplate(
  templateId: string,
): Promise<void> {
  const response = await apiFetch(`/api/sentence-templates/${templateId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete practice sentence.");
  }
}
