import { apiFetch } from "@/lib/api/apiFetch";

export async function generateSampleSpeech(text: string): Promise<Blob> {
  const response = await apiFetch("/api/tts", {
    method: "POST",
    json: { text },
  });

  if (!response.ok) {
    throw new Error(getTtsApiErrorMessage(response.status));
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
    throw new Error(getTtsApiErrorMessage(response.status));
  }

  return response.blob();
}

function getTtsApiErrorMessage(status: number): string {
  if (status === 400) {
    return "Invalid text-to-speech request. Please check the text.";
  }

  if (status === 401) {
    return "Please log in to generate sample audio.";
  }

  if (status === 403) {
    return "This demo is available upon request. Please contact the developer if you need access.";
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
