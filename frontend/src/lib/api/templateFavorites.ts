import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/firebase";

async function getIdTokenOrNull(): Promise<string | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  return user.getIdToken();
}

async function getRequiredIdToken(): Promise<string> {
  const idToken = await getIdTokenOrNull();

  if (!idToken) {
    throw new Error("Please log in to use favorites.");
  }

  return idToken;
}

export async function fetchFavoriteTemplateIds(): Promise<string[]> {
  const idToken = await getIdTokenOrNull();

  if (!idToken) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api/template-favorites`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch favorite templates.");
  }

  return response.json();
}

export async function addTemplateFavorite(templateId: string): Promise<void> {
  const idToken = await getRequiredIdToken();

  const response = await fetch(
    `${API_BASE_URL}/api/template-favorites/${templateId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to add favorite.");
  }
}

export async function removeTemplateFavorite(
  templateId: string,
): Promise<void> {
  const idToken = await getRequiredIdToken();

  const response = await fetch(
    `${API_BASE_URL}/api/template-favorites/${templateId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to remove favorite.");
  }
}
