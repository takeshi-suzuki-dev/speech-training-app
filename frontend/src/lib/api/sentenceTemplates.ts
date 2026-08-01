import { z } from "zod";

import { apiFetch } from "@/lib/api/apiFetch";
import { parseJsonResponse } from "@/lib/api/parseResponse";

const sentenceCategorySchema = z.object({
  id: z.string(),
  categoryKey: z.string().nullable(),
  displayName: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number(),
  userCategory: z.boolean(),
});

export type SentenceCategory = z.infer<typeof sentenceCategorySchema>;

export type SaveSentenceCategoryRequest = {
  displayName: string;
  description: string | null;
};

const sentenceTemplateSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  templateKey: z.string().nullable(),
  title: z.string(),
  displayText: z.string(),
  scoringText: z.string(),
  sampleAudioText: z.string(),
  difficulty: z.string(),
  sortOrder: z.number(),
  /**
   * True when the signed-in user owns this template. Seed templates are system
   * content with no owner and are read-only: the API rejects updates to them,
   * so the edit affordance is hidden. To change a seed phrase, create your own.
   */
  userTemplate: z.boolean(),
});

export type SentenceTemplate = z.infer<typeof sentenceTemplateSchema>;

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

  return parseJsonResponse(
    response,
    z.array(sentenceCategorySchema),
    "Failed to read sentence categories",
  );
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

  return parseJsonResponse(
    response,
    sentenceCategorySchema,
    "Failed to read the created category",
  );
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

  return parseJsonResponse(
    response,
    sentenceCategorySchema,
    "Failed to read the updated category",
  );
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

  return parseJsonResponse(
    response,
    z.array(sentenceTemplateSchema),
    "Failed to read sentence templates",
  );
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

  return parseJsonResponse(
    response,
    sentenceTemplateSchema,
    "Failed to read the created sentence",
  );
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

  return parseJsonResponse(
    response,
    sentenceTemplateSchema,
    "Failed to read the updated sentence",
  );
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
