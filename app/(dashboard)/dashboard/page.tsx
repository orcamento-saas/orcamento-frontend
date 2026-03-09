"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { getBudgets } from "@/services/budgets";
import type { Budget } from "@/types/budget";
import type { ApiError } from "@/lib/api";

type RangePreset = "today" | "yesterday" | "last7" | "custom";

type DayStats = {
  label: string;
  signed: number;
  unsigned: number;
  concluded: number;
};

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

function dayKey(date: Date): string {
  return toDateInputValue(date);
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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

  if (preset === "last7") {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 6);
    return { start, end: todayEnd };
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
    <Card className="relative overflow-hidden rounded-3xl border-0 p-0 shadow-lg shadow-zinc-200/70">
      <div className={`rounded-3xl bg-gradient-to-br ${toneClass} p-4 text-white`}>
        <p className="text-sm font-medium text-white/90">{title}</p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </Card>
  );
}

function LineChart({ data }: { data: DayStats[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 900;
  const height = 210;
  const padding = { top: 20, right: 18, bottom: 28, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.signed, d.unsigned, d.concluded))
  );

  const xFor = (idx: number) => {
    if (data.length <= 1) return padding.left + innerW / 2;
    return padding.left + (idx / (data.length - 1)) * innerW;
  };

  const yFor = (val: number) => padding.top + innerH - (val / maxVal) * innerH;

  const toPath = (series: Array<number>) => {
    if (series.length === 0) return "";
    if (series.length === 1) {
      return `M${xFor(0).toFixed(2)},${yFor(series[0]).toFixed(2)}`;
    }

    const points = series.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
    let path = `M${points[0]!.x.toFixed(2)},${points[0]!.y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] ?? points[i]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const p3 = points[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }

    return path;
  };

  const signedPath = toPath(data.map((d) => d.signed));
  const unsignedPath = toPath(data.map((d) => d.unsigned));
  const concludedPath = toPath(data.map((d) => d.concluded));

  const yTicks = 4;

  const labelStep = data.length > 10 ? Math.ceil(data.length / 10) : 1;
  const hoverRow = hoveredIdx != null ? data[hoveredIdx] : null;
  const hoverX = hoveredIdx != null ? xFor(hoveredIdx) : 0;

  const tooltipWidth = 170;
  const tooltipHeight = 82;
  const tooltipX = Math.min(
    Math.max(padding.left, hoverX + 12),
    width - padding.right - tooltipWidth
  );
  const tooltipY = padding.top + 6;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="dashBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} rx="16" fill="url(#dashBg)" />

        {Array.from({ length: yTicks + 1 }).map((_, idx) => {
          const v = (maxVal / yTicks) * idx;
          const y = yFor(v);
          return (
            <g key={`tick-${idx}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#cbd5e1" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fontSize="10" fill="#64748b">{Math.round(v)}</text>
            </g>
          );
        })}

        {data.map((d, idx) => (
          idx % labelStep !== 0 ? null : (
          <text key={`${d.label}-${idx}`} x={xFor(idx)} y={height - 10} textAnchor="middle" fontSize="10" fill="#475569">
            {d.label}
          </text>
          )
        ))}

        <path d={signedPath} fill="none" stroke="#0891b2" strokeWidth="2.5" />
        <path d={unsignedPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
        <path d={concludedPath} fill="none" stroke="#16a34a" strokeWidth="2.5" />

        {data.map((d, i) => (
          <g key={`dots-${i}`}>
            <circle cx={xFor(i)} cy={yFor(d.signed)} r="3" fill="#0891b2" />
            <circle cx={xFor(i)} cy={yFor(d.unsigned)} r="3" fill="#f59e0b" />
            <circle cx={xFor(i)} cy={yFor(d.concluded)} r="3" fill="#16a34a" />
          </g>
        ))}

        {data.map((_, i) => {
          const x = xFor(i);
          const prevX = i === 0 ? padding.left : xFor(i - 1);
          const nextX = i === data.length - 1 ? width - padding.right : xFor(i + 1);
          const left = i === 0 ? padding.left : (prevX + x) / 2;
          const right = i === data.length - 1 ? width - padding.right : (x + nextX) / 2;

          return (
            <rect
              key={`hover-hit-${i}`}
              x={left}
              y={padding.top}
              width={Math.max(1, right - left)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseMove={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {hoverRow && (
          <g pointerEvents="none">
            <line
              x1={hoverX}
              x2={hoverX}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />

            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="12"
              fill="#ffffff"
              stroke="#cbd5e1"
            />

            <text x={tooltipX + 10} y={tooltipY + 18} fontSize="11" fontWeight="700" fill="#0f172a">
              {hoverRow.label}
            </text>
            <text x={tooltipX + 10} y={tooltipY + 36} fontSize="11" fill="#0e7490">
              Assinados: {hoverRow.signed}
            </text>
            <text x={tooltipX + 10} y={tooltipY + 52} fontSize="11" fill="#b45309">
              Sem assinatura: {hoverRow.unsigned}
            </text>
            <text x={tooltipX + 10} y={tooltipY + 68} fontSize="11" fill="#166534">
              Concluídos: {hoverRow.concluded}
            </text>
          </g>
        )}
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
    const signed = filtered.filter((b) => isSignedBudget(b)).length;
    const unsigned = filtered.filter((b) => !isSignedBudget(b)).length;
    const concluded = filtered.filter((b) => b.executed).length;
    return { signed, unsigned, concluded };
  }, [filtered]);

  const chartData = useMemo<DayStats[]>(() => {
    const days: Date[] = [];
    const cursor = startOfDay(period.start);
    const end = startOfDay(period.end);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const byDay = new Map<string, DayStats>();
    days.forEach((d) => {
      byDay.set(dayKey(d), { label: formatLabel(d), signed: 0, unsigned: 0, concluded: 0 });
    });

    filtered.forEach((b) => {
      const d = new Date(b.createdAt);
      const key = dayKey(startOfDay(d));
      const row = byDay.get(key);
      if (!row) return;
      if (isSignedBudget(b)) row.signed += 1;
      else row.unsigned += 1;
      if (b.executed) row.concluded += 1;
    });

    return Array.from(byDay.values());
  }, [filtered, period]);

  return (
    <div className="h-full overflow-y-auto pb-2 pr-1">
      <div className="space-y-2.5">
      <h1 className="text-xl font-bold text-zinc-900">Dashboard</h1>

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
              onClick={() => setPreset("last7")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "last7"
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
              onClick={() => setPreset("last7")}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                preset === "last7"
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

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        <SummaryCard title="Assinados" value={summary.signed} tone="teal" />
        <SummaryCard title="Sem assinatura" value={summary.unsigned} tone="amber" />
        <SummaryCard title="Concluídos" value={summary.concluded} tone="emerald" />
      </div>

      <Card className="rounded-3xl border-zinc-200 bg-white p-2.5 sm:p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Evolução por período</h2>
            <p className="text-xs text-zinc-500">Quantidade de orçamentos por dia</p>
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
          <LineChart data={chartData} />
        )}
      </Card>
      </div>
    </div>
  );
}
