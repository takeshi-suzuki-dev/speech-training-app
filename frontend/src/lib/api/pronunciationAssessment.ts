import { apiFetch } from "@/lib/api/apiFetch";
import { getAccessDeniedMessage } from "@/lib/api/apiError";
import { parseJsonResponse } from "@/lib/api/parseResponse";
import {
  speechEvaluateResponseSchema,
  type SpeechEvaluateResponse,
} from "@/types/pronunciation";

export async function scorePronunciation(
  audioFile: File,
  referencetext: string,
  sentenceId?: string,
): Promise<SpeechEvaluateResponse> {
  const formData = new FormData();

  formData.append("audio", audioFile);
  formData.append("referenceText", referencetext);
  formData.append("mode", "sentence");

  if (sentenceId) {
    formData.append("sentenceId", sentenceId);
  }

  const response = await apiFetch("/api/pronunciation/score", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getSpeechApiErrorMessage(response));
  }

  return parseJsonResponse(
    response,
    speechEvaluateResponseSchema,
    "Failed to read the pronunciation score",
  );
}

async function getSpeechApiErrorMessage(response: Response): Promise<string> {
  const status = response.status;

  if (status === 400) {
    return "Invalid request. Please check the audio file and reference text.";
  }

  if (status === 401) {
    return "Please log in to use pronunciation scoring.";
  }

  if (status === 403) {
    return getAccessDeniedMessage(response);
  }

  if (status === 429) {
    return "Speech service quota or rate limit was reached. Please try again later.";
  }

  if (status >= 500) {
    return "Speech service error. Please try again later.";
  }

  return "Failed to evaluate pronunciation. Please try again.";
}
