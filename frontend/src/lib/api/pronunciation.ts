import { SpeechEvaluateResponse } from "@/types/pronunciation";

export async function generateSampleSpeech(text: string): Promise<Blob> {
  const response = await fetch("http://localhost:8080/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`TTS Request failed: ${response.status}`);
  }

  return response.blob();
}

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
    throw new Error(`Score Request failed: ${response.status}`);
  }

  return response.json();
}
