"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { BudgetScheduleModal } from "@/components/BudgetScheduleModal";
import type { BudgetScheduleTarget } from "@/components/BudgetScheduleModal";
import { ShareBudget } from "@/components/ShareBudget";
import { useAuth } from "@/hooks/useAuth";
import { getBudgetCards, updateBudgetExecuted } from "@/services/budgets";
import type { BudgetCard } from "@/types/budget";
import type { ApiError } from "@/lib/api";

type RangePreset = "today" | "tomorrow" | "next7" | "custom";

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

  if (preset === "tomorrow") {
    const t = new Date(todayStart);
    t.setDate(t.getDate() + 1);
    return { start: startOfDay(t), end: endOfDay(t) };
  }

  /** Próximos 7 dias: hoje até o fim do 7º dia (hoje + 6). */
  if (preset === "next7") {
    const endDate = new Date(todayStart);
    endDate.setDate(endDate.getDate() + 6);
    return { start: todayStart, end: endOfDay(endDate) };
  }

  const parsedStart = customStart ? new Date(`${customStart}T00:00:00`) : todayStart;
  const parsedEnd = customEnd ? new Date(`${customEnd}T23:59:59.999`) : todayEnd;
  if (parsedStart > parsedEnd) {
    return { start: startOfDay(parsedEnd), end: endOfDay(parsedStart) };
  }
  return { start: parsedStart, end: parsedEnd };
}

function isDayInPeriod(day: Date, periodStart: Date, periodEnd: Date): boolean {
  const ds = startOfDay(day).getTime();
  return ds >= startOfDay(periodStart).getTime() && ds <= endOfDay(periodEnd).getTime();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatScheduleDateTime(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} - ${timePart}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} - ${timePart}`;
}

const WEEKDAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Primeiro dia do mês como índice 0 = segunda */
function mondayBasedOffset(year: number, monthIndex: number): number {
  const first = new Date(year, monthIndex, 1);
  const dow = first.getDay();
  return dow === 0 ? 6 : dow - 1;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

const btnBase =
  "inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 h-9 w-9 sm:h-10 sm:w-10 [&_svg]:size-5 [&_svg]:shrink-0 sm:[&_svg]:size-6";
const btnPurple =
  "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500";
const btnBlue =
  "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500";
const btnGreen =
  "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500";
const btnYellow =
  "cursor-not-allowed bg-amber-400 text-white opacity-90";
const btnAmber =
  "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500";

const IconAgenda = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconVerPdf = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconAssinado = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <path d="M8 18c1.2-1.1 2.4-1.1 3.6 0s2.4 1.1 3.6 0" />
  </svg>
);
const IconCompartilhar = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" x2="21" y1="14" y2="3" />
  </svg>
);

export default function AgendadosPage() {
  const { accessToken } = useAuth();
  const [budgets, setBudgets] = useState<BudgetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingExecutedId, setUpdatingExecutedId] = useState<string | null>(null);
  const [shareBudgetId, setShareBudgetId] = useState<string | null>(null);

  const [preset, setPreset] = useState<RangePreset>("today");
  const today = new Date();
  const [customStart, setCustomStart] = useState(toDateInputValue(today));
  const [customEnd, setCustomEnd] = useState(toDateInputValue(today));

  /** Nos presets rápidos, espelha data inicial/final nos campos de personalização (mobile). */
  useEffect(() => {
    if (preset === "custom") return;
    const now = new Date();
    const todayStart = startOfDay(now);

    if (preset === "today") {
      setCustomStart(toDateInputValue(todayStart));
      setCustomEnd(toDateInputValue(todayStart));
      return;
    }

    if (preset === "tomorrow") {
      const t = new Date(todayStart);
      t.setDate(t.getDate() + 1);
      const day = startOfDay(t);
      setCustomStart(toDateInputValue(day));
      setCustomEnd(toDateInputValue(day));
      return;
    }

    if (preset === "next7") {
      const endPlus6 = new Date(todayStart);
      endPlus6.setDate(endPlus6.getDate() + 6);
      setCustomStart(toDateInputValue(todayStart));
      setCustomEnd(toDateInputValue(endPlus6));
    }
  }, [preset]);

  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [scheduleTarget, setScheduleTarget] = useState<BudgetScheduleTarget | null>(null);
  /** Só mobile: calendário pode ser recolhido para ganhar espaço na lista. */
  const [mobileCalendarExpanded, setMobileCalendarExpanded] = useState(true);

  const handleExecutedChange = async (id: string, executed: boolean) => {
    if (!accessToken) return;
    setUpdatingExecutedId(id);
    try {
      const updated = await updateBudgetExecuted(id, executed, accessToken);
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                executed: updated.executed,
                executedAt: updated.executedAt ?? null,
              }
            : b
        )
      );
    } catch (err) {
      const e = err as ApiError;
      alert(e.message ?? "Erro ao atualizar execução.");
    } finally {
      setUpdatingExecutedId(null);
    }
  };

  const period = useMemo(
    () => buildPeriod(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const periodKey = `${period.start.getTime()}-${period.end.getTime()}`;

  useEffect(() => {
    setCalendarMonth(new Date(period.start.getFullYear(), period.start.getMonth(), 1));
  }, [periodKey]);

  useEffect(() => {
    if (!accessToken) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const all: BudgetCard[] = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const res = await getBudgetCards(accessToken, { page, limit });
          all.push(...res.data);
          if (res.data.length < limit) break;
          page += 1;
        }

        setBudgets(all);
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Erro ao carregar orçamentos.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [accessToken]);

  const scheduledInPeriod = useMemo(() => {
    return budgets.filter((b) => {
      const at = b.serviceScheduledAt;
      if (!at) return false;
      const t = new Date(at);
      return t >= period.start && t <= period.end;
    });
  }, [budgets, period.start, period.end]);

  const daysWithSchedule = useMemo(() => {
    const set = new Set<string>();
    for (const b of scheduledInPeriod) {
      if (!b.serviceScheduledAt) continue;
      set.add(toDateInputValue(new Date(b.serviceScheduledAt)));
    }
    return set;
  }, [scheduledInPeriod]);

  const listItems = useMemo(() => {
    const rows = [...scheduledInPeriod];
    rows.sort(
      (a, b) =>
        new Date(a.serviceScheduledAt!).getTime() - new Date(b.serviceScheduledAt!).getTime()
    );
    return rows;
  }, [scheduledInPeriod]);

  const y = calendarMonth.getFullYear();
  const m = calendarMonth.getMonth();
  const offset = mondayBasedOffset(y, m);
  const dim = daysInMonth(y, m);
  const monthLabel = calendarMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const todayYmd = toDateInputValue(new Date());

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pr-1">
      <div className="shrink-0 space-y-2 border-b border-zinc-200/60 bg-white pb-3 sm:space-y-3 sm:pb-4">
        <h1 className="mt-2 text-center text-xl font-bold text-zinc-900 sm:mt-0 sm:text-left">
          Agendados
        </h1>
        <p className="hidden text-sm text-zinc-500 sm:block sm:text-left">
          Orçamentos com data de execução agendada no período
        </p>

        <Card className="rounded-3xl border-zinc-200 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-2.5">
          <div className="space-y-1.5 sm:hidden">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["today", "Hoje"],
                  ["tomorrow", "Amanhã"],
                  ["next7", "Próximos 7 dias"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    preset === key
                      ? "bg-zinc-900 text-white shadow"
                      : "bg-white text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {label}
                </button>
              ))}
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
              {(
                [
                  ["today", "Hoje"],
                  ["tomorrow", "Amanhã"],
                  ["next7", "Próximos 7 dias"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    preset === key
                      ? "bg-zinc-900 text-white shadow"
                      : "bg-white text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {label}
                </button>
              ))}
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
      </div>

      {error && (
        <Card className="mt-2 shrink-0 border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </Card>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-6 [-webkit-overflow-scrolling:touch]">
        {loading ? (
          <Card className="rounded-3xl border-zinc-200 p-8 text-center text-sm text-zinc-500">
            Carregando agendamentos...
          </Card>
        ) : (
          <div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start lg:gap-4">
            <Card className="rounded-3xl border-zinc-200 bg-white p-2 sm:p-3 lg:p-4">
              <div className="mb-1 flex items-center gap-2 sm:mb-2 lg:mb-3 lg:gap-2">
                <button
                  type="button"
                  className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 shadow-[0_2px_8px_rgba(15,118,110,0.12)] ring-1 ring-teal-100/90 transition-all hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-[0_4px_12px_rgba(15,118,110,0.18)] hover:ring-teal-200/70 active:scale-[0.94] lg:hidden"
                  aria-expanded={mobileCalendarExpanded}
                  aria-label={
                    mobileCalendarExpanded ? "Recolher calendário" : "Expandir calendário"
                  }
                  onClick={() => setMobileCalendarExpanded((v) => !v)}
                >
                  {mobileCalendarExpanded ? (
                    <svg
                      className="h-[18px] w-[18px] transition-transform duration-200 group-active:scale-95"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M7 14.5 12 9.5l5 5" />
                    </svg>
                  ) : (
                    <svg
                      className="h-[18px] w-[18px] transition-transform duration-200 group-active:scale-95"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M7 9.5 12 14.5l5-5" />
                    </svg>
                  )}
                </button>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-1 sm:gap-2">
                  <button
                    type="button"
                    aria-label="Mês anterior"
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100 sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm"
                    onClick={() =>
                      setCalendarMonth(new Date(y, m - 1, 1))
                    }
                  >
                    ‹
                  </button>
                  <h2 className="min-w-0 flex-1 truncate text-center text-xs font-semibold capitalize leading-tight text-zinc-900 sm:text-sm lg:text-base">
                    {monthLabel}
                  </h2>
                  <button
                    type="button"
                    aria-label="Próximo mês"
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100 sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm"
                    onClick={() =>
                      setCalendarMonth(new Date(y, m + 1, 1))
                    }
                  >
                    ›
                  </button>
                </div>
              </div>

              <div
                className={`${mobileCalendarExpanded ? "block" : "hidden"} lg:block`}
              >
                <div className="grid grid-cols-7 gap-px text-center text-[9px] font-semibold uppercase leading-none text-zinc-500 sm:gap-0.5 sm:text-[10px] lg:gap-1 lg:text-xs">
                  {WEEKDAYS_PT.map((w) => (
                    <div key={w} className="py-0.5 sm:py-1">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="mt-0.5 grid grid-cols-7 gap-px sm:mt-1 sm:gap-0.5 lg:gap-1">
                  {cells.map((day, idx) => {
                    if (day === null) {
                      return (
                        <div
                          key={`e-${idx}`}
                          className="aspect-square max-h-8 min-h-0 sm:max-h-10 lg:max-h-none"
                        />
                      );
                    }
                    const cellDate = new Date(y, m, day);
                    const ymd = toDateInputValue(cellDate);
                    const inPeriod = isDayInPeriod(cellDate, period.start, period.end);
                    const hasSchedule = daysWithSchedule.has(ymd);
                    const isToday = ymd === todayYmd;

                    return (
                      <div
                        key={ymd}
                        className={`relative flex aspect-square max-h-8 min-h-0 select-none flex-col items-center justify-center rounded-md text-[11px] font-medium leading-none sm:max-h-10 sm:rounded-lg sm:text-sm lg:max-h-none lg:text-base ${
                          !inPeriod ? "text-zinc-300" : "text-zinc-800"
                        } ${
                          isToday && inPeriod
                            ? "ring-1 ring-teal-500 ring-offset-0 sm:ring-2 sm:ring-offset-1"
                            : ""
                        }`}
                      >
                        <span>{day}</span>
                        {hasSchedule && inPeriod && (
                          <span
                            className="pointer-events-none mt-px h-1 w-1 rounded-full bg-emerald-500 sm:mt-0.5 sm:h-1.5 sm:w-1.5 sm:shadow-sm sm:shadow-emerald-600/30"
                            title="Agendamento neste dia"
                            aria-hidden
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="min-h-[200px] rounded-3xl border-zinc-200 bg-white p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-900">
                  Orçamentos agendados no período
                </h2>
                <span className="text-sm text-zinc-500">
                  {listItems.length}{" "}
                  {listItems.length === 1 ? "item" : "itens"}
                </span>
              </div>

              {listItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-500">
                  Nenhum agendamento neste período.
                </p>
              ) : (
                <ul className="space-y-2">
                  {listItems.map((b) => (
                    <li key={b.id}>
                      <div className="rounded-lg border border-zinc-200 bg-teal-50 p-4">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="mt-1 text-sm font-semibold text-zinc-900 sm:text-base sm:font-semibold">
                                {b.clientName ?? "—"}
                              </p>
                              <p className="mt-0.5 text-xs text-zinc-600 sm:mt-1 sm:text-sm">
                                {`${b.title ?? "—"} - Total ${formatCurrency(b.value)}`}
                              </p>
                            </div>
                            <div className="flex w-full items-center justify-between sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2">
                              <button
                                type="button"
                                className={`${btnBase} ${btnAmber}`}
                                title="Agendar execução do serviço"
                                onClick={() =>
                                  setScheduleTarget({
                                    id: b.id,
                                    clientName: b.clientName ?? null,
                                    serviceScheduledAt: b.serviceScheduledAt ?? null,
                                  })
                                }
                              >
                                <IconAgenda />
                              </button>
                              {b.pdfUrl ? (
                                <a
                                  href={b.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${btnBase} ${btnPurple}`}
                                  title="Ver PDF"
                                >
                                  <IconVerPdf />
                                </a>
                              ) : null}
                              {b.signedPdfUrl ? (
                                <a
                                  href={b.signedPdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${btnBase} ${btnGreen}`}
                                  title="PDF assinado"
                                >
                                  <IconAssinado />
                                </a>
                              ) : (
                                <span
                                  className={`${btnBase} ${btnYellow}`}
                                  title="PDF assinado (não disponível)"
                                >
                                  <IconAssinado />
                                </span>
                              )}
                              <button
                                type="button"
                                className={`${btnBase} ${btnBlue}`}
                                title="Compartilhar orçamento para assinatura"
                                onClick={() => setShareBudgetId(b.id)}
                              >
                                <IconCompartilhar />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                            <div className="flex items-center rounded-md bg-white/80 px-3 py-2">
                              <label className="inline-flex items-center gap-2 text-xs text-zinc-700 sm:text-sm">
                                <input
                                  type="checkbox"
                                  checked={!!b.executed}
                                  disabled={updatingExecutedId === b.id}
                                  onChange={(e) => handleExecutedChange(b.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span>
                                  {updatingExecutedId === b.id ? "Salvando..." : "Concluído"}
                                </span>
                              </label>
                            </div>
                            <div className="rounded-md bg-white/80 px-3 py-2">
                              {b.createdAt ? (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Criação </span>
                                    <span className="text-emerald-700">{formatDateTime(b.createdAt)}</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Criação
                                  </p>
                                  <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                    {formatDateTime(b.createdAt)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Criação </span>
                                    <span className="text-amber-700">Não informado</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Criação
                                  </p>
                                  <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">
                                    Não informado
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="rounded-md bg-white/80 px-3 py-2">
                              {b.signedAt ? (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Assinatura </span>
                                    <span className="text-emerald-700">{formatDateTime(b.signedAt)}</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Assinatura
                                  </p>
                                  <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                    {formatDateTime(b.signedAt)}
                                  </p>
                                </>
                              ) : b.signedPdfUrl ? (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Assinatura </span>
                                    <span className="text-emerald-700">Assinado</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Assinatura
                                  </p>
                                  <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                    Assinado
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Assinatura </span>
                                    <span className="text-amber-700">Não assinado</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Assinatura
                                  </p>
                                  <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">
                                    Não assinado
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="rounded-md bg-white/80 px-3 py-2">
                              {b.serviceScheduledAt ? (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Agendamento </span>
                                    <span className="text-emerald-700">{formatScheduleDateTime(b.serviceScheduledAt)}</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Agendamento
                                  </p>
                                  <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                    {formatScheduleDateTime(b.serviceScheduledAt)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Agendamento </span>
                                    <span className="text-amber-700">Sem agendamento</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Agendamento
                                  </p>
                                  <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">
                                    Sem agendamento
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="rounded-md bg-white/80 px-3 py-2">
                              {b.executed ? (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Conclusão </span>
                                    <span className="text-emerald-700">
                                      {b.executedAt ? formatDateTime(b.executedAt) : "Concluído"}
                                    </span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Conclusão
                                  </p>
                                  <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                    {b.executedAt ? formatDateTime(b.executedAt) : "Concluído"}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold sm:hidden">
                                    <span className="text-zinc-500">Conclusão </span>
                                    <span className="text-amber-700">Não concluído</span>
                                  </p>
                                  <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">
                                    Conclusão
                                  </p>
                                  <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">
                                    Não concluído
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>

      <BudgetScheduleModal
        target={scheduleTarget}
        accessToken={accessToken}
        onClose={() => setScheduleTarget(null)}
        onSaved={(updated) => {
          setBudgets((prev) =>
            prev.map((x) =>
              x.id === updated.id
                ? {
                    ...x,
                    title: updated.title,
                    value: updated.value,
                    status: updated.status,
                    executed: updated.executed,
                    executedAt: updated.executedAt ?? null,
                    pdfUrl: updated.pdfUrl,
                    signedPdfUrl: updated.signedPdfUrl,
                    documentDate: updated.documentDate ?? null,
                    clientName: updated.clientName ?? null,
                    serviceScheduledAt: updated.serviceScheduledAt ?? null,
                  }
                : x
            )
          );
        }}
      />

      {shareBudgetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Compartilhar orçamento para assinatura
              </h2>
              <button
                type="button"
                onClick={() => setShareBudgetId(null)}
                className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Fechar"
              >
                x
              </button>
            </div>
            <ShareBudget
              budgetId={shareBudgetId}
              onClose={() => setShareBudgetId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
