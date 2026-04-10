import { SpeechEvaluateResponse } from "@/types/pronunciation";

export async function scorePronunciation(
  audioFile: File,
  referencetext: string,
): Promise<SpeechEvaluateResponse> {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("referenceText", referencetext);

  const response = await fetch(
    "http://localhost:8080/api/pronunciation/score",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
