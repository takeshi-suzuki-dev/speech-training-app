import { describe, expect, it } from "vitest";
import { getAccessDeniedMessage, readApiErrorMessage } from "./apiError";

// The point of these: a 403 has several causes, and two of them happen to users who ARE registered
// (expired access, email registered under a different Google account). Collapsing them all into
// "request access" tells those users something false, so the backend's message has to survive the
// trip to the screen.

function jsonResponse(body: unknown, status = 403): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("readApiErrorMessage", () => {
  it("returns the message the backend sent", async () => {
    const response = jsonResponse({
      error: "ACCESS_NOT_ALLOWED",
      message: "Demo access is inactive or expired.",
    });

    await expect(readApiErrorMessage(response)).resolves.toBe(
      "Demo access is inactive or expired.",
    );
  });

  it("returns null when the body carries no message", async () => {
    await expect(
      readApiErrorMessage(jsonResponse({ error: "ACCESS_NOT_ALLOWED" })),
    ).resolves.toBeNull();
  });

  it("returns null for a blank message", async () => {
    await expect(
      readApiErrorMessage(jsonResponse({ message: "   " })),
    ).resolves.toBeNull();
  });

  it("returns null for a non-JSON body instead of throwing", async () => {
    // A proxy or load balancer can answer with an HTML error page.
    const response = new Response("<html>502 Bad Gateway</html>", {
      status: 502,
    });

    await expect(readApiErrorMessage(response)).resolves.toBeNull();
  });

  it("leaves the response body readable by the caller", async () => {
    // The helper clones, so a caller inspecting the body afterwards is not left
    // with an already-consumed stream.
    const response = jsonResponse({ message: "Something went wrong." });

    await readApiErrorMessage(response);

    await expect(response.json()).resolves.toEqual({
      message: "Something went wrong.",
    });
  });
});

describe("getAccessDeniedMessage", () => {
  it("surfaces the expired-access reason rather than a generic one", async () => {
    const response = jsonResponse({
      error: "ACCESS_NOT_ALLOWED",
      message: "Demo access is inactive or expired.",
    });

    await expect(getAccessDeniedMessage(response)).resolves.toBe(
      "Demo access is inactive or expired.",
    );
  });

  it("surfaces the account-mismatch reason rather than a generic one", async () => {
    const response = jsonResponse({
      error: "ACCESS_NOT_ALLOWED",
      message:
        "This Google account does not match the registered Firebase user.",
    });

    await expect(getAccessDeniedMessage(response)).resolves.toBe(
      "This Google account does not match the registered Firebase user.",
    );
  });

  it("falls back to the generic wording when the body carries no message", async () => {
    await expect(
      getAccessDeniedMessage(jsonResponse({ error: "ACCESS_NOT_ALLOWED" })),
    ).resolves.toContain("available upon request");
  });
});
