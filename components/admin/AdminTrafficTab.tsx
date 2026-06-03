"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAdminTrafficSummary } from "@/services/traffic";
import type { ApiError } from "@/lib/api";
import type { TrafficSummaryResponse } from "@/types/traffic";

type RangePreset = "today" | "yesterday" | "last7" | "custom";

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function buildPeriod(
  preset: RangePreset,
  customStart: string,
  customEnd: string
): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (preset === "today") {
    return { start: todayStart, end: todayEnd };
  }

  if (preset === "yesterday") {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }

  if (preset === "last7") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 6);
    return { start: startOfDay(startDate), end: todayEnd };
  }

  const parsedStart = customStart ? new Date(`${customStart}T00:00:00`) : todayStart;
  const parsedEnd = customEnd ? new Date(`${customEnd}T23:59:59.999`) : todayEnd;
  if (parsedStart > parsedEnd) {
    return { start: startOfDay(parsedEnd), end: endOfDay(parsedStart) };
  }
  return { start: parsedStart, end: parsedEnd };
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (rest === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${rest}s`;
}

function TrafficSummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "slate" | "emerald" | "amber" | "teal" | "violet";
}) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-500 to-green-600"
      : tone === "amber"
        ? "from-amber-500 to-orange-600"
        : tone === "teal"
          ? "from-teal-600 to-cyan-700"
          : tone === "violet"
            ? "from-violet-600 to-purple-700"
            : "from-slate-700 to-slate-900";

  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-gradient-to-br ${toneClass} px-5 text-white shadow-lg shadow-zinc-200/60`}
      style={{ height: "40px" }}
    >
      <p className="text-sm font-medium text-white/80">{label}</p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as ApiError).message;
    if (typeof msg === "string" && msg.trim()) {
      return msg;
    }
  }
  return fallback;
}

const emptySummary: TrafficSummaryResponse = {
  visits: 0,
  avgDurationSeconds: null,
  viewedFeatures: 0,
  viewedPlans: 0,
  clickedStartFree: 0,
};

export function AdminTrafficTab({ accessToken }: { accessToken: string | null }) {
  const [preset, setPreset] = useState<RangePreset>("today");
  const [customStart, setCustomStart] = useState(() => toDateInputValue(new Date()));
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(new Date()));
  const [summary, setSummary] = useState<TrafficSummaryResponse>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(
    () => buildPeriod(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getAdminTrafficSummary(accessToken, {
      from: period.start.toISOString(),
      to: period.end.toISOString(),
    })
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSummary(emptySummary);
          setError(getErrorMessage(err, "Não foi possível carregar o tráfego."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, period.start, period.end]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-[2rem] border-zinc-200 p-0 shadow-lg shadow-zinc-200/60">
        <CardHeader className="mb-0 border-b border-zinc-200 px-6 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["today", "Hoje"],
                  ["yesterday", "Ontem"],
                  ["last7", "Última semana"],
                  ["custom", "Personalizar"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPreset(id)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    preset === id
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          {preset === "custom" ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                De
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Até
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
                />
              </label>
            </div>
          ) : null}
          </div>
        </CardHeader>

        <div className="px-6 py-6">
          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-[120px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <TrafficSummaryTile
                label="Entraram no site"
                value={summary.visits}
                tone="slate"
              />
              <TrafficSummaryTile
                label="Tempo médio"
                value={formatDuration(summary.avgDurationSeconds)}
                tone="teal"
              />
              <TrafficSummaryTile
                label="Aba Planos"
                value={summary.viewedPlans}
                tone="violet"
              />
              <TrafficSummaryTile
                label="Aba Funcionalidades"
                value={summary.viewedFeatures}
                tone="amber"
              />
              <TrafficSummaryTile
                label="Clicou testar grátis"
                value={summary.clickedStartFree}
                tone="emerald"
              />
            </section>
          )}
        </div>
      </Card>
    </div>
  );
}
