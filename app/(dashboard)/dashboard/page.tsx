"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { getBudgets } from "@/services/budgets";
import type { Budget } from "@/types/budget";
import type { ApiError } from "@/lib/api";

type RangePreset = "today" | "yesterday" | "next7" | "custom";

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

function isSignedBudget(b: Budget): boolean {
  return b.status === "SIGNED" || !!b.signedPdfUrl;
}

function buildPeriod(preset: RangePreset, customStart: string, customEnd: string): { start: Date; end: Date } {
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

  /** Últimos 7 dias: de 7 dias atrás até ontem. */
  if (preset === "next7") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(todayStart);
    endDate.setDate(endDate.getDate() - 1);
    return { start: startOfDay(startDate), end: endOfDay(endDate) };
  }

  const parsedStart = customStart ? new Date(`${customStart}T00:00:00`) : todayStart;
  const parsedEnd = customEnd ? new Date(`${customEnd}T23:59:59.999`) : todayEnd;
  if (parsedStart > parsedEnd) {
    return { start: startOfDay(parsedEnd), end: endOfDay(parsedStart) };
  }
  return { start: parsedStart, end: parsedEnd };
}

function SummaryCard({ title, value, tone }: { title: string; value: number; tone: "teal" | "amber" | "emerald" }) {
  const toneClass =
    tone === "teal"
      ? "from-cyan-500 to-teal-600"
      : tone === "amber"
        ? "from-amber-500 to-orange-600"
        : "from-emerald-500 to-green-600";

  return (
    <div className={`rounded-lg sm:rounded-3xl bg-gradient-to-br ${toneClass} p-1.5 sm:p-4 min-h-[72px] sm:min-h-0 text-white shadow-md shadow-zinc-200/70`}>
      <p className="text-[9px] leading-tight sm:text-sm font-medium text-white/90">{title}</p>
      <p className="mt-0.5 text-sm leading-none sm:mt-1.5 sm:text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function PieChart({
  signed,
  unsigned,
  concluded,
}: {
  signed: number;
  unsigned: number;
  concluded: number;
}) {
  const total = signed + unsigned + concluded;
  const radius = 84;
  const strokeWidth = 38;
  const size = radius * 2 + strokeWidth;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const signedLen = total > 0 ? (signed / total) * circumference : 0;
  const unsignedLen = total > 0 ? (unsigned / total) * circumference : 0;
  const concludedLen = total > 0 ? (concluded / total) * circumference : 0;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#0891b2"
            strokeWidth={strokeWidth}
            strokeDasharray={`${signedLen} ${Math.max(0, circumference - signedLen)}`}
            strokeLinecap="butt"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${unsignedLen} ${Math.max(0, circumference - unsignedLen)}`}
            strokeDashoffset={-signedLen}
            strokeLinecap="butt"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#16a34a"
            strokeWidth={strokeWidth}
            strokeDasharray={`${concludedLen} ${Math.max(0, circumference - concludedLen)}`}
            strokeDashoffset={-(signedLen + unsignedLen)}
            strokeLinecap="butt"
          />
        </g>
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          className="fill-zinc-900 text-xl font-bold"
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          className="fill-zinc-500 text-[11px]"
        >
          no período
        </text>
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preset, setPreset] = useState<RangePreset>("today");
  const today = new Date();
  const [customStart, setCustomStart] = useState(toDateInputValue(today));
  const [customEnd, setCustomEnd] = useState(toDateInputValue(today));

  /** Alinha os inputs de data (mobile) ao intervalo real de “Últimos 7 dias”. */
  useEffect(() => {
    if (preset !== "next7") return;
    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() - 1);
    setCustomStart(toDateInputValue(start));
    setCustomEnd(toDateInputValue(end));
  }, [preset]);

  useEffect(() => {
    if (!accessToken) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const all: Budget[] = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const res = await getBudgets(accessToken, { page, limit });
          all.push(...res.data);
          if (res.data.length < limit) break;
          page += 1;
        }

        setBudgets(all);
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [accessToken]);

  const period = useMemo(
    () => buildPeriod(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const filtered = useMemo(() => {
    return budgets.filter((b) => {
      const createdAt = new Date(b.createdAt);
      return createdAt >= period.start && createdAt <= period.end;
    });
  }, [budgets, period]);

  const summary = useMemo(() => {
    let signed = 0;
    let unsigned = 0;
    let concluded = 0;

    for (const b of filtered) {
      // Categorias exclusivas:
      // 1) Concluído
      // 2) Assinado (somente se NÃO concluído)
      // 3) Sem assinatura
      if (b.executed) {
        concluded += 1;
      } else if (isSignedBudget(b)) {
        signed += 1;
      } else {
        unsigned += 1;
      }
    }

    return { signed, unsigned, concluded };
  }, [filtered]);

  return (
    <div className="h-full overflow-y-auto pb-2 pr-1">
      <div className="space-y-2.5">
      <h1 className="mt-2 text-center text-xl font-bold text-zinc-900 sm:mt-0 sm:text-left">Dashboard</h1>

      <Card className="rounded-3xl border-zinc-200 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-2.5">
        <div className="space-y-1.5 sm:hidden">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("today")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "today"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPreset("yesterday")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "yesterday"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => setPreset("next7")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "next7"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Últimos 7 dias
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-hidden">
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm ${
                preset === "custom"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <span className="sm:hidden">Pers.</span>
              <span className="hidden sm:inline">Personalizar</span>
            </button>

            <input
              type="date"
              value={customStart}
              onFocus={() => setPreset("custom")}
              onChange={(e) => setCustomStart(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 sm:px-3 sm:text-sm"
              aria-label="Data inicial"
            />
            <span className="shrink-0 text-xs text-zinc-500">até</span>
            <input
              type="date"
              value={customEnd}
              onFocus={() => setPreset("custom")}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 sm:px-3 sm:text-sm"
              aria-label="Data final"
            />
          </div>
        </div>

        <div className="hidden sm:flex sm:flex-col sm:gap-1.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("today")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "today"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setPreset("yesterday")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "yesterday"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => setPreset("next7")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "next7"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "custom"
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Personalizar
            </button>
          </div>

          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900"
                aria-label="Data inicial"
              />
              <span className="text-sm text-zinc-500">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900"
                aria-label="Data final"
              />
            </div>
          )}
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>}

      <div className="grid grid-cols-3 gap-2 md:gap-2.5">
        <SummaryCard title="Assinados" value={summary.signed} tone="teal" />
        <SummaryCard title="Sem assinatura" value={summary.unsigned} tone="amber" />
        <SummaryCard title="Concluídos" value={summary.concluded} tone="emerald" />
      </div>

      <Card className="rounded-3xl border-zinc-200 bg-white p-2.5 sm:p-3 min-h-[320px]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Distribuição por status</h2>
            <p className="text-xs text-zinc-500">Resumo do período selecionado</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1 text-cyan-700"><span className="h-2.5 w-2.5 rounded-full bg-cyan-600" />Assinados</span>
            <span className="inline-flex items-center gap-1 text-amber-700"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Sem assinatura</span>
            <span className="inline-flex items-center gap-1 text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Concluídos</span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
            Carregando dados do dashboard...
          </div>
        ) : (
          <PieChart
            signed={summary.signed}
            unsigned={summary.unsigned}
            concluded={summary.concluded}
          />
        )}
      </Card>
      </div>
    </div>
  );
}
