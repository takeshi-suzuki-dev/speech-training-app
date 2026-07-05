"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider } from "@/lib/firebase";
import { fetchAuthMe, AuthMeResponse } from "@/lib/api/auth";

const PRONUNCIATION_PATH = "/pronunciation";

type PanelState =
  | { kind: "checking" }
  | { kind: "denied"; message: string }
  | { kind: "allowed"; user: AuthMeResponse };

export function AuthPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [panelState, setPanelState] = useState<PanelState | null>(null);
  const [didAutoRedirect, setDidAutoRedirect] = useState(false);
  const loginInProgressRef = useRef(false);
  const hasRedirectedRef = useRef(false);
  const justLoggedInRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setPanelState(null);
        hasRedirectedRef.current = false;
        setDidAutoRedirect(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setPanelState({ kind: "checking" });

    fetchAuthMe()
      .then((authUser) => {
        if (cancelled) return;
        setPanelState({ kind: "allowed", user: authUser });

        // Only auto-redirect right after the user explicitly clicked
        // "Continue with Google" in this session — not every time an
        // already-signed-in user's panel mounts (e.g. navigating here by
        // clicking the logo, where they're presumably checking their account).
        if (justLoggedInRef.current && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          justLoggedInRef.current = false;
          setDidAutoRedirect(true);
          router.push(PRONUNCIATION_PATH);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to check account access. Please try again.";
        setPanelState({ kind: "denied", message });
      });

    return () => {
      cancelled = true;
    };
  }, [user, router]);

  const handleLogin = async () => {
    if (loginInProgressRef.current) {
      return;
    }

    loginInProgressRef.current = true;
    setIsLoggingIn(true);

    try {
      await signInWithPopup(auth, googleProvider);
      justLoggedInRef.current = true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (
          error.code === "auth/cancelled-popup-request" ||
          error.code === "auth/popup-closed-by-user"
        ) {
          return;
        }
      }

      console.error("Login failed:", error);
    } finally {
      loginInProgressRef.current = false;
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // ── Not signed in ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3">
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          Already approved for access?
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-3">
          Sign in with your approved Google account to continue to the
          practice app.
        </p>
        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="rounded-xl bg-purple-500 hover:bg-purple-600 px-6 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingIn ? "Signing in…" : "Continue with Google"}
        </button>
      </div>
    );
  }

  // ── Signed in, access check in flight ───────────────────────
  if (!panelState || panelState.kind === "checking") {
    return (
      <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
        <p>Checking your access…</p>
      </div>
    );
  }

  // ── Signed in and allowlisted ───────────────────────────────
  if (panelState.kind === "allowed") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray-500">
          Signed in as{" "}
          <span className="font-bold text-gray-800">
            {panelState.user.email}
          </span>
        </p>
        <a
          href={PRONUNCIATION_PATH}
          className="rounded-xl bg-purple-500 hover:bg-purple-600 px-6 py-3 text-sm font-bold text-white transition"
        >
          Go to Pronunciation App →
        </a>
        {didAutoRedirect && (
          <p className="text-xs text-gray-400">Redirecting automatically…</p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-purple-500 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  // ── Signed in but denied (not allowlisted, or the check failed) ─
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-gray-500">
        Signed in as{" "}
        <span className="font-bold text-gray-800">{user.email}</span>
      </p>
      <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
        {panelState.message}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-purple-500 transition"
      >
        Logout
      </button>
    </div>
  );
}
