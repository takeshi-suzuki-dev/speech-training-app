import { apiFetch } from "@/lib/api/apiFetch";
import { getAccessDeniedMessage } from "@/lib/api/apiError";

export async function generateSampleSpeech(text: string): Promise<Blob> {
  const response = await apiFetch("/api/tts", {
    method: "POST",
    json: { text },
  });

  if (!response.ok) {
    throw new Error(await getTtsApiErrorMessage(response));
  }

  return response.blob();
}

export async function generateTemplateSampleAudio(
  templateId: string,
): Promise<Blob> {
  const response = await apiFetch(
    `/api/sentence-templates/${templateId}/sample-audio`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(await getTtsApiErrorMessage(response));
  }

  return response.blob();
}

async function getTtsApiErrorMessage(response: Response): Promise<string> {
  const status = response.status;

  if (status === 400) {
    return "Invalid text-to-speech request. Please check the text.";
  }

  if (status === 401) {
    return "Please log in to generate sample audio.";
  }

  if (status === 403) {
    return getAccessDeniedMessage(response);
  }

  if (status === 404) {
    return "Sample audio is not available for this sentence.";
  }

  if (status === 429) {
    return "Text-to-speech quota or rate limit was reached. Please try again later.";
  }

  if (status >= 500) {
    return "Text-to-speech service error. Please try again later.";
  }

  return "Failed to generate sample audio. Please try again.";
}
