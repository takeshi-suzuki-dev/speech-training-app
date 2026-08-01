import { apiFetch } from "@/lib/api/apiFetch";
import { readApiErrorMessage } from "@/lib/api/apiError";

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
    const message = await readApiErrorMessage(response);

    throw new Error(
      message ?? "Something went wrong. Please try again in a moment.",
    );
  }
}
