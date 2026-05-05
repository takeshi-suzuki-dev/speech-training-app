import { API_BASE_URL } from "@/lib/config/config";
import { SpeechEvaluateResponse } from "@/types/pronunciation";
import { getOrCreateClientId } from "../clientId";

export async function scorePronunciation(
  audioFile: File,
  referencetext: string,
  sentenceId?: string,
): Promise<SpeechEvaluateResponse> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("referenceText", referencetext);
  formData.append("clientId", getOrCreateClientId());
  formData.append("mode", "sentence");

  if (sentenceId) formData.append("sentenceId", sentenceId);

  const response = await fetch(`${API_BASE_URL}/api/pronunciation/score`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(getSpeechApiErrorMessage(response.status));
  }

  return response.json();
}

function getSpeechApiErrorMessage(status: number): string {
  if (status === 400) {
    return "Invalid request. Please check the audio file and reference text.";
  }
  if (status === 401 || status === 403) {
    return "Speech service authentication failed.";
  }
  if (status === 429) {
    return "Speech service quota or rate limit was reached. Please try again later.";
  }
  if (status >= 500) {
    return "Speech service error. Please try again later.";
  }
  return "Failed to evaluate pronunciation. Please try again.";
}
