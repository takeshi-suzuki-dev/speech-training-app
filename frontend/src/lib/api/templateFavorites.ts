import { apiFetch } from "@/lib/api/apiFetch";

export async function fetchFavoriteTemplateIds(): Promise<string[]> {
  const response = await apiFetch("/api/template-favorites", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch favorite templates.");
  }

  return response.json();
}

export async function addTemplateFavorite(templateId: string): Promise<void> {
  const response = await apiFetch(`/api/template-favorites/${templateId}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to add favorite.");
  }
}

export async function removeTemplateFavorite(
  templateId: string,
): Promise<void> {
  const response = await apiFetch(`/api/template-favorites/${templateId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to remove favorite.");
  }
}
