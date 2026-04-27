export async function generateSampleSpeech(text: string): Promise<Blob> {
  const response = await fetch("http://localhost:8080/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(getTtsApiErrorMessage(response.status));
  }

  return response.blob();
}

function getTtsApiErrorMessage(status: number): string {
  if (status === 400) {
    return "Invalid text-to-speech request. Please check the text.";
  }
  if (status === 401 || status === 403) {
    return "Text-to-speech service authentication failed.";
  }
  if (status === 429) {
    return "Text-to-speech quota or rate limit was reached. Please try again later.";
  }
  if (status >= 500) {
    return "Text-to-speech service error. Please try again later.";
  }
  return "Failed to generate sample audio. Please try again.";
}
