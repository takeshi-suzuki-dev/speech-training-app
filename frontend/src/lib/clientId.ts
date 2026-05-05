import { CLIENT_ID_STORAGE_KEY } from "@/lib/constants";

export function getOrCreateClientId(): string {
  const existingClientId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);

  if (existingClientId) {
    return existingClientId;
  }

  const newClientId = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, newClientId);

  return newClientId;
}
