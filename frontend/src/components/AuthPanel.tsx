"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider } from "@/lib/firebase";

export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [idTokenPreview, setIdTokenPreview] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginInProgressRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setIdTokenPreview(null);
        return;
      }

      const token = await currentUser.getIdToken();

      console.log("Firebase uid:", currentUser.uid);
      console.log("Firebase ID token:", token);

      setIdTokenPreview(`${token.slice(0, 24)}...`);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (loginInProgressRef.current) {
      console.log("Login is already in progress. Ignored.");
      return;
    }

    loginInProgressRef.current = true;
    setIsLoggingIn(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (
          error.code === "auth/cancelled-popup-request" ||
          error.code === "auth/popup-closed-by-user"
        ) {
          console.warn("Google login popup was cancelled.");
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

  const handleCheckBackendAuth = async () => {
    if (!user) return;

    const token = await user.getIdToken();

    const response = await fetch("http://localhost:8080/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("Backend auth response:", data);
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      <h2>Auth Test</h2>

      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <p>UID: {user.uid}</p>
          {idTokenPreview && <p>ID Token: {idTokenPreview}</p>}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
          <button type="button" onClick={handleCheckBackendAuth}>
            Check backend auth
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleLogin} disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in..." : "Login with Google"}
        </button>
      )}
    </div>
  );
}
