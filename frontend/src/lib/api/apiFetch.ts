import { onAuthStateChanged, User } from "firebase/auth";

import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/firebase";

type ApiFetchOptions = RequestInit & {
  authRequired?: boolean;
  json?: unknown;
};

export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { authRequired = true, json, headers, ...fetchOptions } = options;

  const requestHeaders = new Headers(headers);

  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (authRequired) {
    const user = await getResolvedCurrentUser();

    if (!user) {
      throw new Error("Please log in to use this feature.");
    }

    const idToken = await user.getIdToken();
    requestHeaders.set("Authorization", `Bearer ${idToken}`);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : fetchOptions.body,
  });
}

async function getResolvedCurrentUser(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
