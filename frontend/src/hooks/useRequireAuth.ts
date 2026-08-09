"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";

const SIGN_IN_PATH = "/";

/**
 * Route guard for pages that require a signed-in user (currently
 * /pronunciation and /history).
 *
 * Redirects to the sign-in page once Firebase has confirmed there is no
 * user — not before, since `isAuthInitialized` is false for a brief moment on every
 * load and treating that as "signed out" would bounce an already-signed-in
 * person. `router.replace` is used instead of `push` so the protected page
 * doesn't stay in browser history for someone who was never let in.
 *
 * Callers should not render page content until `user` is present; render a
 * loading/redirecting placeholder instead (see /pronunciation and /history
 * for the pattern).
 */
export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);

  useEffect(() => {
    if (isAuthInitialized && !user) {
      router.replace(SIGN_IN_PATH);
    }
  }, [isAuthInitialized, user, router]);

  return { user, isAuthInitialized };
}
