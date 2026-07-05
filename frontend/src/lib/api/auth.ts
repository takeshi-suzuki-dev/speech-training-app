import { apiFetch } from "@/lib/api/apiFetch";

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
//   403 -> not allowlisted (same wording used by tts.ts / pronunciationAssessment.ts)
//   401 -> token missing/invalid/expired

export type AuthMeResponse = {
  uid: string;
  email: string;
};

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await apiFetch("/api/auth/me");

  if (!response.ok) {
    throw new Error(getAuthMeErrorMessage(response.status));
  }

  return response.json();
}

function getAuthMeErrorMessage(status: number): string {
  if (status === 401) {
    return "Please log in to continue.";
  }

  if (status === 403) {
    return "This demo is available upon request. Please contact the developer if you need access.";
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return "Failed to check account access. Please try again.";
}
