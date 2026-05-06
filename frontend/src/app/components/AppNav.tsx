"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/pronunciation", label: "Practice", icon: "🎙️" },
  { href: "/history", label: "History", icon: "📈" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-8 h-14 bg-white/85 backdrop-blur-md border-b border-purple-100">
      {/* Title — ✦ only on mobile, full text on desktop */}
      <span className="font-black bg-linear-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent shrink-0">
        <span className="block md:hidden text-xl leading-none">✦</span>
        <span className="hidden md:block text-lg leading-none">
          ✦ Speech Trainer
        </span>
      </span>

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
        <span className="flex items-center gap-1 bg-yellow-50 border-2 border-yellow-200 rounded-full px-2.5 py-1 md:px-3 text-xs font-bold text-yellow-700">
          🔥 12
        </span>
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-300 to-violet-400 flex items-center justify-center text-sm shrink-0">
          🎤
        </div>
      </div>
    </nav>
  );
}
