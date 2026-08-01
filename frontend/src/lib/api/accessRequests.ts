import { apiFetch } from "@/lib/api/apiFetch";

export type AccessRequestPayload = {
  name: string;
  email: string;
  message: string;
  /** Honeypot. Hidden from real users, so a value here marks a bot. */
  website: string;
};

/**
 * Sent from the public landing page by visitors who are not signed in, so this
 * is the one call that skips the Authorization header.
 */
export async function submitAccessRequest(
  payload: AccessRequestPayload,
): Promise<void> {
  const response = await apiFetch("/public/access-requests", {
    method: "POST",
    authRequired: false,
    json: payload,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);

    throw new Error(
      detail?.message ?? "Something went wrong. Please try again in a moment.",
    );
  }
}
