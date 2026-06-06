import { API_BASE_URL } from "@/lib/config";
import { auth } from "../firebase";

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
  const headers = await getOptionalAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/sentence-categories`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sentence categories.");
  }

  return response.json();
}

export async function createSentenceCategory(
  request: SaveSentenceCategoryRequest,
): Promise<SentenceCategory> {
  const idToken = await getRequiredIdToken();

  const response = await fetch(`${API_BASE_URL}/api/sentence-categories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
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
  const idToken = await getRequiredIdToken();

  const response = await fetch(
    `${API_BASE_URL}/api/sentence-categories/${categoryId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update category.");
  }

  return response.json();
}

export async function fetchSentenceTemplates(
  categoryId: string,
): Promise<SentenceTemplate[]> {
  const headers = await getOptionalAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/api/sentence-templates?categoryId=${categoryId}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch sentence templates.");
  }

  return response.json();
}

export async function deleteSentenceCategory(
  categoryId: string,
): Promise<void> {
  const idToken = await getRequiredIdToken();

  const response = await fetch(
    `${API_BASE_URL}/api/sentence-categories/${categoryId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete category.");
  }
}

async function getRequiredIdToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in to manage categories.");
  }

  return user.getIdToken();
}

export async function createSentenceTemplate(
  request: SaveSentenceTemplateRequest,
): Promise<SentenceTemplate> {
  const idToken = await getRequiredIdToken();

  const response = await fetch(`${API_BASE_URL}/api/sentence-templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
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
  const idToken = await getRequiredIdToken();

  const response = await fetch(
    `${API_BASE_URL}/api/sentence-templates/${templateId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update practice sentence.");
  }

  return response.json();
}

export async function deleteSentenceTemplate(
  templateId: string,
): Promise<void> {
  const idToken = await getRequiredIdToken();

  const response = await fetch(
    `${API_BASE_URL}/api/sentence-templates/${templateId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete practice sentence.");
  }
}

async function getOptionalAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;

  if (!user) {
    return {};
  }

  const idToken = await user.getIdToken();

  return {
    Authorization: `Bearer ${idToken}`,
  };
}
