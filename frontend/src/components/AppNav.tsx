"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const navLinks = [
  { href: "/pronunciation", label: "Practice", icon: "🎙️" },
  { href: "/history", label: "History", icon: "📈" },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  };

  return (
    <nav className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-8 h-14 bg-white/85 backdrop-blur-md border-b border-purple-100">
      {/* Title — ✦ only on mobile, full text on desktop */}
      <Link
        href="/"
        className="font-black bg-linear-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent shrink-0"
      >
        <span className="block md:hidden text-xl leading-none">✦</span>
        <span className="hidden md:block text-lg leading-none">
          ✦ SpeechAI
        </span>
      </Link>

      {/* Nav buttons */}
      <div className="flex items-center gap-2">
        {navLinks.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          const base =
            "rounded-full font-bold transition flex items-center justify-center";
          const active =
            "bg-linear-to-r from-pink-400 to-violet-400 text-white shadow-sm";
          const inactive =
            "border border-purple-100 bg-white text-gray-500 hover:border-purple-200 hover:bg-purple-50";
          return (
            <Link
              key={href}
              href={href}
              className={`${base} ${isActive ? active : inactive}`}
            >
              {/* Mobile: icon-only circle */}
              <span className="flex md:hidden w-9 h-9 items-center justify-center text-lg">
                {icon}
              </span>
              {/* Desktop: icon + label */}
              <span className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm">
                <span className="text-base leading-none">{icon}</span>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Streak badge — hidden until real streak data is wired up (later phase).
        <span className="flex items-center gap-1 bg-yellow-50 border-2 border-yellow-200 rounded-full px-2.5 py-1 md:px-3 text-xs font-bold text-yellow-700">
          🔥 12
        </span>
        */}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={isMenuOpen}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0 transition"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-gray-400"
              aria-hidden="true"
            >
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12Zm0 2.5c-3.6 0-8.5 1.8-8.5 5.4v1.9h17v-1.9c0-3.6-4.9-5.4-8.5-5.4Z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
              <p className="px-4 py-2 text-xs text-gray-400 truncate">
                {user?.email ?? "Not signed in"}
              </p>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-purple-500 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
