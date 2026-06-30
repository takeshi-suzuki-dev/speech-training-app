"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DailyScoreTrendResult,
  fetchDailyScoreTrends,
} from "@/lib/api/assessmentResults";
import AppNav from "@/components/AppNav";

type TabType = "overall" | "breakdown";

// ── Helpers ───────────────────────────────────────────────────
function formatScore(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toFixed(1);
}

function getLatestRank(data: DailyScoreTrendResult[]): number | null {
  const latest = data.at(-1);
  if (!latest || latest.overallAverage == null) return null;

  const uniqueScores = Array.from(
    new Set(
      data
        .map((item) => item.overallAverage)
        .filter((score): score is number => score != null)
        .map((score) => Number(score.toFixed(2))),
    ),
  ).sort((a, b) => b - a);

  const latestScore = Number(latest.overallAverage.toFixed(2));
  const rank = uniqueScores.findIndex((score) => score === latestScore);
  return rank >= 0 ? rank + 1 : null;
}

function getRankMessage(rank: number | null): {
  crown: string;
  message: string;
} | null {
  if (rank === 1) return { crown: "👑", message: "All-time best!" };
  if (rank === 2) return { crown: "🥈", message: "2nd best ever!" };
  if (rank === 3) return { crown: "🥉", message: "3rd best ever!" };
  return null;
}

// ── UI primitives ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-widest uppercase text-purple-300 mb-3">
      {children}
    </p>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overall");
  const [trendData, setTrendData] = useState<DailyScoreTrendResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function loadTrendData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await fetchDailyScoreTrends();
        const sortedData = [...data].sort((a, b) =>
          a.practiceDate.localeCompare(b.practiceDate),
        );
        setTrendData(sortedData);
      } catch (error) {
        console.error(error);
        setErrorMessage("Failed to load history trends.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTrendData();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const latestPoint = trendData.at(-1);
  const latestRank = useMemo(() => getLatestRank(trendData), [trendData]);
  const rankMessage = getRankMessage(latestRank);

  const isHot =
    latestPoint?.overallAverage != null &&
    latestPoint?.overallMovingAverage5Days != null &&
    latestPoint.overallAverage >= latestPoint.overallMovingAverage5Days;

  const isShortTermAboveLongTerm =
    latestPoint?.overallMovingAverage5Days != null &&
    latestPoint?.overallMovingAverage20Days != null &&
    latestPoint.overallMovingAverage5Days >=
      latestPoint.overallMovingAverage20Days;

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 via-blue-50 to-emerald-50">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-gray-400">Loading history…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 via-blue-50 to-emerald-50">
        <AppNav />
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <Card>
            <SectionLabel>Error</SectionLabel>
            <p className="text-sm text-red-400">{errorMessage}</p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────
  if (trendData.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 via-blue-50 to-emerald-50">
        <AppNav />
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <Card>
            <SectionLabel>History</SectionLabel>
            <p className="text-sm text-gray-400">
              No pronunciation history yet. Try scoring a sentence first.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-blue-50 to-emerald-50">
      <AppNav />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col gap-3 md:gap-4">
        {/* ── Heading + latest score + badges (single card) ── */}
        {(() => {
          const raw = latestPoint?.overallAverage;
          const scoreColor =
            raw == null
              ? "text-gray-300"
              : raw >= 80
                ? "text-emerald-600"
                : raw >= 60
                  ? "text-amber-500"
                  : "text-red-500";
          return (
            <Card>
              <h1 className="text-xl md:text-2xl font-black bg-linear-to-r from-pink-400 to-violet-500 bg-clip-text text-transparent mb-4">
                Score History
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-purple-300 mb-2">
                    Latest Score
                  </p>
                  <p className={`text-3xl font-black ${scoreColor}`}>
                    {formatScore(raw)}
                  </p>
                </div>
                {(rankMessage || isHot) && (
                  <div className="flex flex-wrap gap-2">
                    {rankMessage && (
                      <div className="rounded-full border border-purple-100 bg-linear-to-r from-purple-50 to-pink-50 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-purple-500">
                        <span className="mr-1">{rankMessage.crown}</span>
                        {rankMessage.message}
                      </div>
                    )}
                    {isHot && (
                      <div className="rounded-full border border-orange-100 bg-linear-to-r from-orange-50 to-yellow-50 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-orange-400">
                        🔥 On a roll!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })()}

        {/* ── Tab selector ── */}
        <div className="flex gap-2">
          {(
            [
              { key: "overall", label: "Overall" },
              { key: "breakdown", label: "Score Breakdown" },
            ] as { key: TabType; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold transition ${
                activeTab === key
                  ? "bg-linear-to-r from-pink-400 to-violet-400 text-white shadow-sm"
                  : "border border-purple-100 bg-white text-gray-400 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-400"
              }`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Chart card ── */}
        <Card
          className={
            activeTab === "overall" && isShortTermAboveLongTerm
              ? "bg-red-50! px-2! md:px-5!"
              : "px-2! md:px-5!"
          }
        >
          {activeTab === "overall" ? (
            <>
              <div className="px-3 md:px-0 mb-3">
                <SectionLabel>Overall Pron Trend</SectionLabel>
                <p className="text-xs text-purple-300 font-medium">
                  Daily average uses the last 5 attempts of each practice day.
                </p>
              </div>
              <div className="h-70 md:h-105">
                {isMounted && (
                  <ResponsiveContainer
                    height="100%"
                    width="100%"
                    initialDimension={{ width: 1, height: 1 }}
                  >
                    <LineChart
                      data={trendData}
                      margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                      <XAxis
                        dataKey="practiceDate"
                        tick={{ fontSize: 10, fill: "#c4b5fd" }}
                        interval="preserveStartEnd"
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#c4b5fd" }}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #ede9fe",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Line
                        dataKey="overallAverage"
                        dot={false}
                        name="Daily last-5 avg"
                        stroke="#a855f7"
                        strokeWidth={3}
                        type="linear"
                      />
                      <Line
                        dataKey="overallMovingAverage5Days"
                        dot={false}
                        name="5-day MA"
                        stroke="#ec4899"
                        strokeWidth={2}
                        type="linear"
                      />
                      <Line
                        dataKey="overallMovingAverage20Days"
                        dot={false}
                        name="20-day MA"
                        stroke="#93c5fd"
                        strokeWidth={2}
                        type="linear"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="px-3 md:px-0 mb-3">
                <SectionLabel>Score Breakdown Trend</SectionLabel>
                <p className="text-xs text-purple-300 font-medium">
                  Each line shows the daily last-5 average for each score item.
                </p>
              </div>
              <div className="h-70 md:h-105">
                {isMounted && (
                  <ResponsiveContainer
                    height="100%"
                    width="100%"
                    initialDimension={{ width: 1, height: 1 }}
                  >
                    <LineChart
                      data={trendData}
                      margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                      <XAxis
                        dataKey="practiceDate"
                        tick={{ fontSize: 10, fill: "#c4b5fd" }}
                        interval="preserveStartEnd"
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#c4b5fd" }}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #ede9fe",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Line
                        dataKey="overallAverage"
                        dot={false}
                        name="Overall"
                        stroke="#a855f7"
                        strokeWidth={3}
                        type="linear"
                      />
                      <Line
                        dataKey="accuracyAverage"
                        dot={false}
                        name="Accuracy"
                        stroke="#34d399"
                        strokeWidth={2}
                        type="linear"
                      />
                      <Line
                        dataKey="fluencyAverage"
                        dot={false}
                        name="Fluency"
                        stroke="#fb923c"
                        strokeWidth={2}
                        type="linear"
                      />
                      <Line
                        dataKey="completenessAverage"
                        dot={false}
                        name="Completeness"
                        stroke="#f472b6"
                        strokeWidth={2}
                        type="linear"
                      />
                      <Line
                        dataKey="prosodyAverage"
                        dot={false}
                        name="Prosody"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        type="linear"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
