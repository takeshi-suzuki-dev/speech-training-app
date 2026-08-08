import { apiFetch } from "@/lib/api/apiFetch";
import {
  getAccessDeniedMessage,
  readApiErrorMessage,
} from "@/lib/api/apiError";
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

  // 429 and 5xx both cover several distinct upstream failures. The backend
  // decides what to say; these fallbacks only cover a response that carried no
  // message, and match its wording so neither leaks which vendor failed.
  if (status === 429) {
    return (
      (await readApiErrorMessage(response)) ??
      "This feature is temporarily unavailable. Please try again later."
    );
  }

  if (status >= 500) {
    return (
      (await readApiErrorMessage(response)) ??
      "Something went wrong. Please contact the developer if this keeps happening."
    );
  }

  return "Failed to evaluate pronunciation. Please try again.";
}
