/**
 * The error body the backend sends on a failed request.
 *
 * Both the global exception handler and the auth interceptor produce this shape, so any non-2xx
 * response is expected to carry it.
 */
type ApiErrorBody = {
  error?: string;
  message?: string;
};

/**
 * Reads the message the backend sent, or null if the response carries none.
 *
 * The response body can only be consumed once, so this clones it: a caller that wants to inspect
 * the body itself afterwards is not left with an empty stream.
 */
export async function readApiErrorMessage(
  response: Response,
): Promise<string | null> {
  try {
    const body: ApiErrorBody = await response.clone().json();
    const message = body.message?.trim();
    return message ? message : null;
  } catch {
    // A non-JSON body (a proxy error page, an empty response) is not worth
    // failing over: the caller falls back to its own wording.
    return null;
  }
}

/**
 * The message to show when access is refused.
 *
 * A 403 is not one thing. The allowlist refuses a request for several distinct reasons — the
 * account is not registered, its access has expired, it has been deactivated, or the email is
 * registered against a different Google account — and only the backend knows which. Two of those
 * happen to *legitimately registered* users, so telling everyone to request access would be
 * actively wrong for them. The backend's message is therefore preferred over any wording chosen
 * here, and the generic line below is only the fallback for a response that carries none.
 */
export async function getAccessDeniedMessage(
  response: Response,
): Promise<string> {
  const message = await readApiErrorMessage(response);

  return (
    message ??
    "This demo is available upon request. Please contact the developer if you need access."
  );
}
