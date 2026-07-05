"use client";

import { useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";

// ── Static content ───────────────────────────────────────────
const FEATURES = [
  {
    icon: "🎙️",
    title: "AI pronunciation scoring",
    description:
      "Speak a sentence and get instant word-by-word feedback — accuracy, fluency, and completeness scored per attempt.",
  },
  {
    icon: "📊",
    title: "Progress history",
    description:
      "Every attempt is saved automatically, so you can track your overall score trend over time.",
  },
  {
    icon: "📚",
    title: "Custom phrase library",
    description:
      "Organize practice sentences into categories — daily conversation, interviews, tech talk — or add your own phrases.",
  },
];

const TRIAL_EMAIL = "your-address@example.com"; // TODO: replace with real contact address

// Official logos via Simple Icons CDN (https://simpleicons.org).
// Note: Azure has no official icon in Simple Icons (and Microsoft's brand
// guidelines ask that its product icons not be used to represent
// third-party products), so Azure Speech keeps the ☁️ emoji instead.
const FRONTEND_LOGOS = [
  { name: "Next.js", slug: "nextdotjs" },
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "Chart.js", slug: "chartdotjs" },
];

const BACKEND_LOGOS = [
  { name: "Java", slug: "openjdk" },
  { name: "Spring Boot", slug: "springboot" },
];

const ARCH_ACCENTS = {
  frontend: { fill: "#eff6ff", stroke: "#bfdbfe" }, // blue-50 / blue-200
  firebase: { fill: "#fffbeb", stroke: "#fde68a" }, // amber-50 / amber-200
  backend: { fill: "#f5f3ff", stroke: "#ddd6fe" }, // purple-50 / purple-200
  azure: { fill: "#ecfdf5", stroke: "#a7f3d0" }, // emerald-50 / emerald-200
  elevenlabs: { fill: "#fdf2f8", stroke: "#fbcfe8" }, // pink-50 / pink-200
} as const;

// ── Architecture diagram: circular nodes joined by pipes ──────
// Frontend, Backend, and Firebase form an isosceles triangle (Firebase
// sits on the perpendicular bisector between Frontend and Backend), so
// the two auth arrows are visually balanced. Azure/ElevenLabs pipes are
// the flashy, external AI calls — drawn thicker and more translucent
// to stand out; everything else is a plain thin arrow. Direction:
// single-headed arrows are one-way requests. "verifies token" is the
// one genuine round trip (Backend sends the token, Firebase sends back
// a verdict), so it's the only two-headed arrow.
function ArchitectureDiagram() {
  const nodeIconRow = (
    x: number,
    y: number,
    logos: { name: string; slug: string }[],
    size: number,
    gap: number,
  ) => {
    const totalWidth = logos.length * size + (logos.length - 1) * gap;
    const startX = x - totalWidth / 2;
    return logos.map((logo, i) => (
      <image
        key={logo.name}
        href={`https://cdn.simpleicons.org/${logo.slug}`}
        x={startX + i * (size + gap)}
        y={y - size / 2}
        width={size}
        height={size}
      >
        <title>{logo.name}</title>
      </image>
    ));
  };

  const pipeLabel = (x: number, y: number, text: string, stroke: string) => {
    const w = text.length * 7 + 28;
    return (
      <g>
        <rect
          x={x - w / 2}
          y={y - 14}
          width={w}
          height={28}
          rx={14}
          fill="white"
          stroke={stroke}
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize={12.5}
          fontWeight={700}
          fill="#374151"
        >
          {text}
        </text>
      </g>
    );
  };

  const thinLabel = (x: number, y: number, text: string) => {
    const w = text.length * 6.6 + 24;
    return (
      <g>
        <rect
          x={x - w / 2}
          y={y - 12}
          width={w}
          height={24}
          rx={12}
          fill="white"
          stroke="#ddd6fe"
          strokeWidth={1.5}
        />
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize={11.5}
          fontWeight={700}
          fill="#7c3aed"
        >
          {text}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 1180 620" className="w-full h-auto" role="img">
      <title>Architecture diagram</title>
      <defs>
        <marker
          id="arrowPurple"
          markerWidth={8}
          markerHeight={8}
          refX={8}
          refY={4}
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#c4b5fd" />
        </marker>
        <marker
          id="arrowEmerald"
          markerUnits="userSpaceOnUse"
          markerWidth={38}
          markerHeight={30}
          refX={0}
          refY={15}
          orient="auto"
        >
          <path d="M0,0 L38,15 L0,30 Z" fill="#34d399" />
        </marker>
        <marker
          id="arrowPink"
          markerUnits="userSpaceOnUse"
          markerWidth={38}
          markerHeight={30}
          refX={0}
          refY={15}
          orient="auto"
        >
          <path d="M0,0 L38,15 L0,30 Z" fill="#f472b6" />
        </marker>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.10" />
        </filter>
      </defs>

      {/* ── Backend → AI services: the flashy external calls — thicker, translucent ── */}
      {/* Shaft stops at the arrowhead base; the base-anchored (refX=0) head
          extends 38px forward so its tip lands exactly on the circle boundary. */}
      <path
        d="M 710.3 301.6 Q 809 244 871.2 228"
        fill="none"
        stroke="#34d399"
        strokeOpacity={0.55}
        strokeWidth={14}
        strokeLinecap="butt"
        markerEnd="url(#arrowEmerald)"
      />
      <path
        d="M 710.3 398.4 Q 809 456 871.2 472"
        fill="none"
        stroke="#f472b6"
        strokeOpacity={0.55}
        strokeWidth={14}
        strokeLinecap="butt"
        markerEnd="url(#arrowPink)"
      />
      {pipeLabel(809, 252, "Scoring", "#a7f3d0")}
      {pipeLabel(809, 448, "Sample audio", "#fbcfe8")}

      {/* ── Thin control-flow arrows ── */}
      <line
        x1={293}
        y1={350}
        x2={470}
        y2={350}
        stroke="#c4b5fd"
        strokeWidth={2.5}
        markerEnd="url(#arrowPurple)"
      />
      {thinLabel(380, 350, "API + ID token")}

      {/* Frontend ↔ Firebase ↔ Backend form an isosceles triangle: Firebase
          sits on the perpendicular bisector between the other two nodes. */}
      <line
        x1={251.6}
        y1={264.2}
        x2={330.4}
        y2={176.1}
        stroke="#c4b5fd"
        strokeWidth={2.5}
        markerEnd="url(#arrowPurple)"
      />
      {thinLabel(291, 210, "Google sign-in")}

      {/* Two-way: backend sends the token, Firebase sends back the verdict */}
      <line
        x1={511.7}
        y1={256.8}
        x2={439.6}
        y2={176.1}
        stroke="#c4b5fd"
        strokeWidth={2.5}
        markerEnd="url(#arrowPurple)"
        markerStart="url(#arrowPurple)"
      />
      {thinLabel(476, 206, "verifies token")}

      {/* ── Firebase Auth (top, equidistant from Frontend and Backend) ── */}
      <circle
        cx={385}
        cy={115}
        r={82}
        fill={ARCH_ACCENTS.firebase.fill}
        stroke={ARCH_ACCENTS.firebase.stroke}
        strokeWidth={2.5}
        filter="url(#softShadow)"
      />
      <image
        href="https://cdn.simpleicons.org/firebase"
        x={366}
        y={72}
        width={38}
        height={38}
      >
        <title>Firebase</title>
      </image>
      <text
        x={385}
        y={129}
        textAnchor="middle"
        fontSize={15}
        fontWeight={800}
        fill="#1f2937"
      >
        Firebase Auth
      </text>
      <text x={385} y={149} textAnchor="middle" fontSize={10.5} fill="#6b7280">
        Google sign-in
      </text>

      {/* ── Frontend (left) ── */}
      <circle
        cx={175}
        cy={350}
        r={115}
        fill={ARCH_ACCENTS.frontend.fill}
        stroke={ARCH_ACCENTS.frontend.stroke}
        strokeWidth={2.5}
        filter="url(#softShadow)"
      />
      <text x={175} y={303} textAnchor="middle" fontSize={17} opacity={0.5}>
        💻
      </text>
      <text
        x={175}
        y={335}
        textAnchor="middle"
        fontSize={21}
        fontWeight={800}
        fill="#1f2937"
      >
        Frontend
      </text>
      {nodeIconRow(175, 367, FRONTEND_LOGOS, 27, 9)}
      <text x={175} y={399} textAnchor="middle" fontSize={11.5} fill="#6b7280">
        renders pages, calls the API
      </text>

      {/* ── Spring Boot API (center) ── */}
      <circle
        cx={595}
        cy={350}
        r={125}
        fill={ARCH_ACCENTS.backend.fill}
        stroke={ARCH_ACCENTS.backend.stroke}
        strokeWidth={2.5}
        filter="url(#softShadow)"
      />
      <text x={595} y={301} textAnchor="middle" fontSize={17} opacity={0.5}>
        ⚙️
      </text>
      <text
        x={595}
        y={334}
        textAnchor="middle"
        fontSize={20}
        fontWeight={800}
        fill="#1f2937"
      >
        Spring Boot API
      </text>
      {nodeIconRow(595, 368, BACKEND_LOGOS, 32, 12)}
      <text x={595} y={402} textAnchor="middle" fontSize={11.5} fill="#6b7280">
        checks token, routes AI calls
      </text>

      {/* ── Azure Speech (top-right) ── */}
      <circle
        cx={1005}
        cy={205}
        r={98}
        fill={ARCH_ACCENTS.azure.fill}
        stroke={ARCH_ACCENTS.azure.stroke}
        strokeWidth={2.5}
        filter="url(#softShadow)"
      />
      <text x={1005} y={190} textAnchor="middle" fontSize={34}>
        ☁️
      </text>
      <text
        x={1005}
        y={226}
        textAnchor="middle"
        fontSize={16}
        fontWeight={800}
        fill="#1f2937"
      >
        Azure Speech
      </text>
      <text x={1005} y={247} textAnchor="middle" fontSize={10.5} fill="#6b7280">
        scores pronunciation
      </text>

      {/* ── ElevenLabs (bottom-right) ── */}
      <circle
        cx={1005}
        cy={495}
        r={98}
        fill={ARCH_ACCENTS.elevenlabs.fill}
        stroke={ARCH_ACCENTS.elevenlabs.stroke}
        strokeWidth={2.5}
        filter="url(#softShadow)"
      />
      <image
        href="https://cdn.simpleicons.org/elevenlabs"
        x={985}
        y={450}
        width={40}
        height={40}
      >
        <title>ElevenLabs</title>
      </image>
      <text
        x={1005}
        y={515}
        textAnchor="middle"
        fontSize={16}
        fontWeight={800}
        fill="#1f2937"
      >
        ElevenLabs
      </text>
      <text x={1005} y={536} textAnchor="middle" fontSize={10.5} fill="#6b7280">
        generates sample audio
      </text>
    </svg>
  );
}

// ── Section label (shared style with pronunciation page) ─────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-widest uppercase text-purple-300 mb-3">
      {children}
    </p>
  );
}

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(
      "Trial access request — Pronunciation app",
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
    );

    window.location.href = `mailto:${TRIAL_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-pink-50 via-blue-50 to-emerald-50">
      {/* ── Top bar ── */}
      <header className="max-w-300 mx-auto flex items-center px-6 py-5">
        <span className="text-lg font-black text-gray-800 tracking-tight">
          🗣️ <span className="text-purple-500">Cadence</span>
        </span>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-300 mx-auto px-6 pt-10 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <SectionLabel>Portfolio project</SectionLabel>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
            Speak better,
            <br />
            one sentence at a time.
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
            An AI-powered pronunciation coach that scores your speech in real
            time, tracks your progress, and helps you sound more natural in
            English.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#login"
              className="px-6 py-3 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition"
            >
              Login with Google
            </a>
            <a
              href="#trial"
              className="px-6 py-3 rounded-xl bg-white border-2 border-purple-200 text-purple-600 text-sm font-bold hover:bg-purple-50 transition"
            >
              Request trial access →
            </a>
          </div>
        </div>

        {/* Demo screenshot / video placeholder */}
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <div className="aspect-video rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-purple-200">
            <span className="text-3xl">▶️</span>
            <p className="text-xs font-bold text-purple-400">
              Demo video / screenshot goes here
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-300 mx-auto px-6 pb-16">
        <SectionLabel>What it does</SectionLabel>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-base font-black text-gray-800 mt-3 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack & architecture ── */}
      <section className="max-w-300 mx-auto px-6 pb-16">
        <SectionLabel>Under the hood</SectionLabel>
        <div className="bg-slate-50/70 rounded-2xl shadow-sm p-4 md:p-8">
          <ArchitectureDiagram />
        </div>
      </section>

      {/* ── Access notice + trial request form ── */}
      <section id="trial" className="max-w-300 mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10 grid md:grid-cols-2 gap-8">
          <div>
            <SectionLabel>Access</SectionLabel>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Access is currently invite-only.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Practice sessions and progress history are limited to approved
              Google accounts. Submit a request below — I typically grant access
              within 2 days.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center gap-2 bg-emerald-50 rounded-xl p-6">
              <span className="text-3xl">✅</span>
              <p className="text-sm font-bold text-emerald-700">
                Your email app should have opened — send it to complete the
                request.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Tell me a bit about why you'd like access"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 focus:bg-white transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-3 transition"
              >
                Send trial request
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Login (existing auth component) ── */}
      <section id="login" className="max-w-300 mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10 max-w-md mx-auto text-center">
          <SectionLabel>Account</SectionLabel>
          <AuthPanel />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-300 mx-auto px-6 pb-10 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <span>
          Built with Next.js · Spring Boot · Firebase Auth · Azure Speech ·
          ElevenLabs
        </span>
        <a
          href="https://github.com/takeshi-suzuki-dev/speech-training-app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-gray-500 hover:text-purple-500 transition"
        >
          View source on GitHub →
        </a>
      </footer>
    </main>
  );
}
