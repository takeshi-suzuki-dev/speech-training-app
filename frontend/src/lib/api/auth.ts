import { apiFetch } from "@/lib/api/apiFetch";
import { getAccessDeniedMessage } from "@/lib/api/apiError";

// Mirrors the existing lib/api/tts.ts and lib/api/pronunciationAssessment.ts
// convention: throw an Error with a user-facing message on non-2xx, rather
// than returning a custom result shape. Callers already do
// `error instanceof Error ? error.message : "..."` everywhere else in the
// app, so this keeps AuthPanel consistent with that pattern.
//
// GET /api/auth/me is covered by FirebaseAuthenticationInterceptor
// (registered globally for /api/**), which performs both the Firebase
// token check and the allowlist check before the request reaches
// AuthController. So a single call here tells us everything we need:
//   200 -> { uid, email }  → signed in AND allowlisted
//   403 -> allowlist refused the request; the reason is in the response body
//   401 -> token missing/invalid/expired

export type AuthMeResponse = {
  uid: string;
  email: string;
};

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await apiFetch("/api/auth/me");

  if (!response.ok) {
    throw new Error(await getAuthMeErrorMessage(response));
  }

  return response.json();
}

async function getAuthMeErrorMessage(response: Response): Promise<string> {
  const status = response.status;

  if (status === 401) {
    return "Please log in to continue.";
  }

  if (status === 403) {
    return getAccessDeniedMessage(response);
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return "Failed to check account access. Please try again.";
}
