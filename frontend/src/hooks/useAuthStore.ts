import { create } from "zustand";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  /**
   * False until Firebase's first onAuthStateChanged callback fires.
   *
   * Firebase resolves the initial auth state asynchronously, so `user` starts
   * as `null` regardless of whether someone is actually signed in. Anything
   * that redirects on "no user" (see hooks/useRequireAuth.ts) must wait for
   * this to become true first, or it will bounce an already-signed-in person
   * for a brief moment on every page load.
   */
  isAuthInitialized: boolean;
};

/**
 * The single source of truth for "who is signed in", shared across the app.
 *
 * AppNav, AuthPanel, and useCategoryTemplateManager each used to run their own
 * onAuthStateChanged listener plus local `user` state. Unlike the rest of this
 * project's state (see CODING_GUIDELINES.md §3.3), Firebase auth state is
 * genuinely shared by multiple, unrelated parts of the tree — so this is the
 * one deliberate exception to "no state-management library": one Zustand
 * store, one subscription, started once when this module first loads.
 *
 * Everything else in the app keeps using local/hook state as before; this
 * store is not a general-purpose pattern to reach for elsewhere.
 */
export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, (user) => {
    set({ user, isAuthInitialized: true });
  });

  return {
    user: null,
    isAuthInitialized: false,
  };
});
