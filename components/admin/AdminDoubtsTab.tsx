"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  buildPeriod,
  toDateInputValue,
  type RangePreset,
} from "@/lib/datePeriod";
import type { ApiError } from "@/lib/api";
import {
  deleteAdminDoubtsBulk,
  listAdminDoubts,
  updateAdminDoubtAnswered,
} from "@/services/doubts";
import type { AnsweredFilter, UserDoubtItem } from "@/types/doubts";

const PAGE_SIZE = 12;

type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEmailReplyTemplate(doubt: UserDoubtItem): string {
  return `Assunto: Dúvida plataforma Orçamentos LM

Olá, ${doubt.name}
${doubt.email}

Obrigado pelo seu contato com a plataforma Orçamentos LM.

Sua solicitação:
${doubt.message}

Retorno referente à sua solicitação:
minha resposta


`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    typeof (error as ApiError).message === "string"
  ) {
    return (error as ApiError).message;
  }
  return fallback;
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function EmailReplyTemplateBlock({
  doubt,
  onCopy,
}: {
  doubt: UserDoubtItem;
  onCopy: (text: string) => void;
}) {
  const template = buildEmailReplyTemplate(doubt);

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-800">
          Template para e-mail
        </p>
        <Button variant="primary" size="sm" onClick={() => onCopy(template)}>
          Copiar template
        </Button>
      </div>
      <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-violet-100 bg-white p-3 text-xs leading-relaxed text-zinc-800">
        {template}
      </pre>
    </div>
  );
}

function CopyableDetailField({
  label,
  value,
  onCopy,
  multiline = false,
}: {
  label: string;
  value: string;
  onCopy: (text: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-[4.5rem] shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <p
        className={`min-w-0 flex-1 text-sm text-zinc-900 ${multiline ? "whitespace-pre-wrap" : "break-all"}`}
      >
        {value}
      </p>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
        aria-label={`Copiar ${label.toLowerCase()}`}
        title={`Copiar ${label.toLowerCase()}`}
      >
        <CopyIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function AnsweredToggle({
  answered,
  disabled,
  onToggle,
}: {
  answered: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={answered}
      aria-label={answered ? "Marcar como não respondido" : "Marcar como respondido"}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(!answered);
      }}
      className={`relative inline-flex h-9 w-[13.5rem] shrink-0 rounded-full border p-0.5 transition-colors ${
        answered
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full shadow-md transition-all duration-200 ease-out ${
          answered
            ? "left-[calc(50%+1px)] bg-emerald-600"
            : "left-0.5 bg-red-600"
        }`}
      />
      <span
        className={`relative z-10 flex w-1/2 items-center justify-center px-1 text-[10px] font-semibold leading-tight transition-colors ${
          !answered ? "text-white" : "text-emerald-800"
        }`}
      >
        Não respondido
      </span>
      <span
        className={`relative z-10 flex w-1/2 items-center justify-center px-1 text-[10px] font-semibold leading-tight transition-colors ${
          answered ? "text-white" : "text-red-700"
        }`}
      >
        Respondido
      </span>
    </button>
  );
}

function DateRangeFilters({
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomStartChange,
  onCustomEndChange,
}: {
  preset: RangePreset;
  customStart: string;
  customEnd: string;
  onPresetChange: (preset: RangePreset) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["today", "Hoje"],
            ["yesterday", "Ontem"],
            ["next7", "Última semana"],
            ["custom", "Personalizar"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onPresetChange(value)}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
              preset === value
                ? "bg-zinc-900 text-white shadow"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(event) => onCustomStartChange(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          />
          <input
            type="date"
            value={customEnd}
            onChange={(event) => onCustomEndChange(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          />
        </div>
      )}
    </div>
  );
}

export function AdminDoubtsTab({
  accessToken,
  onFeedback,
}: {
  accessToken: string | null;
  onFeedback: (feedback: FeedbackState) => void;
}) {
  const [doubts, setDoubts] = useState<UserDoubtItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [answeredFilter, setAnsweredFilter] = useState<AnsweredFilter>("ALL");
  const [preset, setPreset] = useState<RangePreset>("today");
  const today = new Date();
  const [customStart, setCustomStart] = useState(toDateInputValue(today));
  const [customEnd, setCustomEnd] = useState(toDateInputValue(today));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailDoubt, setDetailDoubt] = useState<UserDoubtItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const period = useMemo(
    () => buildPeriod(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, answeredFilter, preset, customStart, customEnd]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoading(true);

    const answered =
      answeredFilter === "ALL"
        ? undefined
        : answeredFilter === "ANSWERED";

    listAdminDoubts(accessToken, {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      answered,
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString(),
    })
      .then((response) => {
        if (cancelled) return;
        setDoubts(response.data);
        setTotal(response.total);
        setSelectedIds(new Set());
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        onFeedback({
          tone: "error",
          message: getErrorMessage(error, "Não foi possível carregar as dúvidas."),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    debouncedSearch,
    page,
    answeredFilter,
    period.start,
    period.end,
    onFeedback,
  ]);

  const stats = useMemo(() => {
    return doubts.reduce(
      (acc, doubt) => {
        if (doubt.answered) acc.answered += 1;
        else acc.unanswered += 1;
        return acc;
      },
      { answered: 0, unanswered: 0 }
    );
  }, [doubts]);

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === doubts.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(doubts.map((d) => d.id)));
  };

  const handleToggleAnswered = async (doubt: UserDoubtItem, answered: boolean) => {
    if (!accessToken) return;
    setActionLoading(true);
    try {
      const updated = await updateAdminDoubtAnswered(doubt.id, answered, accessToken);
      setDoubts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      if (detailDoubt?.id === updated.id) {
        setDetailDoubt(updated);
      }
    } catch (error: unknown) {
      onFeedback({
        tone: "error",
        message: getErrorMessage(error, "Não foi possível atualizar o status."),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyField = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      onFeedback({
        tone: "error",
        message: "Não foi possível copiar para a área de transferência.",
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (!accessToken || selectedIds.size === 0) return;
    if (!window.confirm(`Excluir ${selectedIds.size} dúvida(s) selecionada(s)?`)) return;

    setActionLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await deleteAdminDoubtsBulk(ids, accessToken);
      setDoubts((current) => current.filter((item) => !selectedIds.has(item.id)));
      setTotal((current) => Math.max(0, current - ids.length));
      setSelectedIds(new Set());
      if (detailDoubt && selectedIds.has(detailDoubt.id)) setDetailDoubt(null);
      onFeedback({
        tone: "success",
        message: `${ids.length} dúvida(s) excluída(s) com sucesso.`,
      });
    } catch (error: unknown) {
      onFeedback({
        tone: "error",
        message: getErrorMessage(error, "Não foi possível excluir as dúvidas selecionadas."),
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
  <>
    <section className="flex w-full flex-col gap-3 md:grid md:flex-1 md:grid-cols-3 md:gap-3">
      <SummaryTile label="Total no período" value={total} tone="slate" />
      <div className="grid grid-cols-2 gap-3 md:contents">
        <SummaryTile label="Respondidas" value={stats.answered} tone="emerald" />
        <SummaryTile label="Não respondidas" value={stats.unanswered} tone="rose" />
      </div>
    </section>

    <Card className="rounded-[2rem] border-zinc-200 p-0 shadow-lg shadow-zinc-200/60">
      <CardHeader className="mb-0 border-b border-zinc-200 px-6 py-5">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Dúvidas usuários</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Mensagens enviadas pelo ícone de ajuda na plataforma.
            </p>
          </div>

          <DateRangeFilters
            preset={preset}
            customStart={customStart}
            customEnd={customEnd}
            onPresetChange={setPreset}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou e-mail"
            />
            <select
              value={answeredFilter}
              onChange={(event) => setAnsweredFilter(event.target.value as AnsweredFilter)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              <option value="ALL">Todos os status</option>
              <option value="ANSWERED">Respondido</option>
              <option value="UNANSWERED">Não respondido</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex justify-end">
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading}
                onClick={handleDeleteSelected}
              >
                Excluir selecionadas ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <div className="px-6 py-5">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : doubts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center text-sm text-zinc-500">
            Nenhuma dúvida encontrada para os filtros atuais.
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={doubts.length > 0 && selectedIds.size === doubts.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-600">Selecionar todas desta página</span>
            </div>

            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {doubts.map((doubt) => (
                <li key={doubt.id}>
                  <article
                    className="flex cursor-pointer flex-col gap-3 px-4 py-3 transition hover:bg-zinc-50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
                    onClick={() => setDetailDoubt(doubt)}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doubt.id)}
                        onChange={() => toggleSelect(doubt.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300"
                      />
                      <div className="min-w-0 flex-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 sm:overflow-hidden">
                        <p className="text-sm font-semibold text-zinc-900 sm:truncate">
                          {doubt.name}
                        </p>
                        <span className="hidden shrink-0 text-zinc-300 sm:inline" aria-hidden>
                          |
                        </span>
                        <p className="text-sm text-zinc-600 sm:min-w-0 sm:truncate">{doubt.email}</p>
                        <p className="text-xs text-zinc-500 sm:hidden">
                          {formatDateTime(doubt.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="hidden shrink-0 text-xs text-zinc-500 sm:block sm:w-36 sm:text-right">
                      {formatDateTime(doubt.createdAt)}
                    </p>
                    <div
                      className="flex justify-end sm:shrink-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <AnsweredToggle
                        answered={doubt.answered}
                        disabled={actionLoading}
                        onToggle={(next) => void handleToggleAnswered(doubt, next)}
                      />
                    </div>
                  </article>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Página {page} de {totalPages} · {total} registro(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>

    <Modal
      isOpen={Boolean(detailDoubt)}
      onClose={() => setDetailDoubt(null)}
      title="Detalhes da dúvida"
      panelClassName="max-w-lg"
    >
      {detailDoubt && (
        <div className="space-y-4">
          <div className="flex justify-center sm:justify-end">
            <AnsweredToggle
              answered={detailDoubt.answered}
              disabled={actionLoading}
              onToggle={(next) => void handleToggleAnswered(detailDoubt, next)}
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Data</p>
            <p className="mt-1 text-sm text-zinc-900">{formatDateTime(detailDoubt.createdAt)}</p>
          </div>
          <CopyableDetailField
            label="Nome"
            value={detailDoubt.name}
            onCopy={handleCopyField}
          />
          <CopyableDetailField
            label="E-mail"
            value={detailDoubt.email}
            onCopy={handleCopyField}
          />
          <CopyableDetailField
            label="Dúvida"
            value={detailDoubt.message}
            onCopy={handleCopyField}
            multiline
          />
          <EmailReplyTemplateBlock doubt={detailDoubt} onCopy={handleCopyField} />
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setDetailDoubt(null)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  </>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-500 to-green-600"
      : tone === "rose"
        ? "from-rose-500 to-red-600"
        : "from-slate-700 to-slate-900";

  return (
    <div
      className={`flex items-center justify-between rounded-xl bg-gradient-to-br ${toneClass} px-5 text-white shadow-lg shadow-zinc-200/60`}
      style={{ height: "40px" }}
    >
      <p className="text-sm font-medium text-white/80">{label}</p>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
