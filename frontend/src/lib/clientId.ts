const CLIENT_ID_KEY = "speech-training-client-id";

export function getOrCreateClientId(): string {
  if (typeof window === "undefined") {
    throw new Error("clientId is only available in the browser.");
  }

  const existingClientId = window.localStorage.getItem(CLIENT_ID_KEY);

  if (existingClientId) {
    return existingClientId;
  }

  const newClientId = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_ID_KEY, newClientId);

  return newClientId;
}
