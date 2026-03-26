"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getBudgetCards, deleteBudget, updateBudgetExecuted } from "@/services/budgets";
import type { Budget, BudgetCard } from "@/types/budget";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ShareBudget } from "@/components/ShareBudget";
import { MyBudgetsSkeleton } from "@/components/Skeleton";
import { BudgetScheduleModal } from "@/components/BudgetScheduleModal";
import { formatScheduleDisplay } from "@/lib/budgetSchedule";
import type { ApiError } from "@/lib/api";

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDisplayDate(budget: BudgetCard): string {
  if (budget.documentDate) {
    // Usa a mesma lógica do BudgetPdfPreview para evitar problemas de timezone
    const dateStr = budget.documentDate;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return formatDateShort(budget.createdAt);
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });
  }
  return formatDateShort(budget.createdAt);
}

function matchesSearch(b: BudgetCard, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.trim().toLowerCase();
  const title = (b.title ?? "").toLowerCase();
  const clientName = (b.clientName ?? "").toLowerCase();
  return title.includes(q) || clientName.includes(q);
}

function budgetToCard(b: Budget): BudgetCard {
  return {
    id: b.id,
    title: b.title,
    value: b.value,
    status: b.status,
    executed: b.executed,
    executedAt: b.executedAt ?? null,
    pdfUrl: b.pdfUrl,
    signedPdfUrl: b.signedPdfUrl,
    signedAt: null,
    createdAt: b.createdAt,
    documentDate: b.documentDate ?? null,
    clientName: b.clientName ?? null,
    serviceScheduledAt: b.serviceScheduledAt ?? null,
  };
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconAssinado = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <path d="M8 18c1.2-1.1 2.4-1.1 3.6 0s2.4 1.1 3.6 0" />
  </svg>
);
const IconCompartilhar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
);
const IconExcluir = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

export default function MyBudgetsPage() {
  const { accessToken } = useAuth();
  const [budgets, setBudgets] = useState<BudgetCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [signedFilter, setSignedFilter] = useState<"all" | "signed" | "unsigned" | "concluded">("all");
  const [updatingExecutedId, setUpdatingExecutedId] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<BudgetCard | null>(null);
  const [shareBudgetId, setShareBudgetId] = useState<string | null>(null);

  // Debounce search para reduzir requests
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (!accessToken) return;
    getBudgetCards(accessToken, { page: 1, limit: 100 })
      .then((res) => {
        setBudgets(
          res.data.map((row) => ({
            ...row,
            executedAt: row.executedAt ?? null,
            signedAt: row.signedAt ?? null,
            serviceScheduledAt: row.serviceScheduledAt ?? null,
          }))
        );
        setTotal(res.total);
      })
      .catch((err: ApiError) => {
        setError(err.message ?? "Erro ao carregar orçamentos.");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filteredBudgets = useMemo(() => {
    let list = budgets.filter((b) => matchesSearch(b, debouncedSearch));
    if (signedFilter === "signed") list = list.filter((b) => !!b.signedPdfUrl);
    if (signedFilter === "unsigned") list = list.filter((b) => !b.signedPdfUrl);
    if (signedFilter === "concluded") list = list.filter((b) => !!b.executed);
    return list;
  }, [budgets, debouncedSearch, signedFilter]);

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    setDeleting(true);
    try {
      await deleteBudget(id, accessToken);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
      setDeleteId(null);
    } catch (err) {
      const e = err as ApiError;
      alert(e.message ?? "Erro ao excluir.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExecutedChange = async (id: string, executed: boolean) => {
    if (!accessToken) return;
    setUpdatingExecutedId(id);
    try {
      const updated = await updateBudgetExecuted(id, executed, accessToken);
      const updatedCard = budgetToCard(updated);
      setBudgets((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...updatedCard,
                signedAt: b.signedAt,
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

  if (loading) {
    return <MyBudgetsSkeleton />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <div className="mt-2 flex flex-col items-center text-center sm:mt-0 sm:items-start sm:text-left lg:flex-row lg:items-baseline lg:gap-2">
          <h1 className="text-xl font-bold text-zinc-900">Meus orçamentos</h1>
          <p className="mt-1 text-sm text-zinc-500 sm:mt-1 lg:mt-0">
            {total} {total === 1 ? "orçamento" : "orçamentos"} no total
          </p>
        </div>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap gap-2">
        <input
          type="search"
          placeholder="Pesquisar por nome do cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/2 min-w-0 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          aria-label="Pesquisar orçamentos"
        />
        <select
          value={signedFilter}
          onChange={(e) => setSignedFilter(e.target.value as "all" | "signed" | "unsigned" | "concluded")}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          aria-label="Filtrar por assinatura"
        >
          <option value="all">Todos</option>
          <option value="signed">Assinados</option>
          <option value="unsigned">Sem assinatura</option>
          <option value="concluded">Concluído</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 shrink-0 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 bg-gray-50 border-gray-200">
        <div className="min-h-0 flex-1 overflow-y-auto px-0 py-4 sm:p-4">
          {filteredBudgets.length === 0 && !error && (
            <div className="py-12 text-center text-zinc-500">
              {search.trim()
                ? "Nenhum orçamento encontrado para essa pesquisa."
                : "Nenhum orçamento ainda."}
            </div>
          )}

          {filteredBudgets.length > 0 && (
            <ul className="space-y-2 sm:space-y-4">
              {filteredBudgets.map((b) => (
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
                            onClick={() => setScheduleTarget(b)}
                          >
                            <IconAgenda />
                          </button>
                          {b.pdfUrl && (
                            <a
                              href={b.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${btnBase} ${btnPurple}`}
                              title="Ver PDF"
                            >
                              <IconVerPdf />
                            </a>
                          )}
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
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-10 [&_svg]:size-5 [&_svg]:shrink-0 sm:[&_svg]:size-6"
                            onClick={() => setDeleteId(b.id)}
                            title="Excluir"
                          >
                            <IconExcluir />
                          </Button>
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
                            <span>{updatingExecutedId === b.id ? "Salvando..." : "Concluído"}</span>
                          </label>
                        </div>
                        <div className="rounded-md bg-white/80 px-3 py-2">
                          {b.createdAt ? (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Criação </span>
                                <span className="text-emerald-700">{getDisplayDate(b)}</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Criação</p>
                              <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">{getDisplayDate(b)}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Criação </span>
                                <span className="text-amber-700">Não informado</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Criação</p>
                              <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">Não informado</p>
                            </>
                          )}
                        </div>
                        <div className="rounded-md bg-white/80 px-3 py-2">
                          {b.signedAt ? (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Assinatura </span>
                                <span className="text-emerald-700">{formatDateShort(b.signedAt)}</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Assinatura</p>
                              <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">{formatDateShort(b.signedAt)}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Assinatura </span>
                                <span className="text-amber-700">Não assinado</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Assinatura</p>
                              <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">Não assinado</p>
                            </>
                          )}
                        </div>
                        <div className="rounded-md bg-white/80 px-3 py-2">
                          {b.serviceScheduledAt ? (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Agendamento </span>
                                <span className="text-emerald-700">{formatScheduleDisplay(b.serviceScheduledAt)}</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Agendamento</p>
                              <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                {formatScheduleDisplay(b.serviceScheduledAt)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Agendamento </span>
                                <span className="text-amber-700">Sem agendamento</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Agendamento</p>
                              <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">Sem agendamento</p>
                            </>
                          )}
                        </div>
                        <div className="rounded-md bg-white/80 px-3 py-2">
                          {b.executed ? (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Conclusão </span>
                                <span className="text-emerald-700">
                                  {b.executedAt ? formatDateShort(b.executedAt) : "Concluído"}
                                </span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Conclusão</p>
                              <p className="hidden text-xs font-semibold text-emerald-700 sm:block sm:text-sm">
                                {b.executedAt ? formatDateShort(b.executedAt) : "Concluído"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-semibold sm:hidden">
                                <span className="text-zinc-500">Conclusão </span>
                                <span className="text-amber-700">Não concluído</span>
                              </p>
                              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:block">Conclusão</p>
                              <p className="hidden text-xs font-semibold text-amber-700 sm:block sm:text-sm">Não concluído</p>
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
        </div>
      </Card>

      <BudgetScheduleModal
        target={scheduleTarget}
        accessToken={accessToken}
        onClose={() => setScheduleTarget(null)}
        onSaved={(updated) => {
          const card = budgetToCard(updated);
          setBudgets((prev) =>
            prev.map((x) =>
              x.id === card.id
                ? { ...card, signedAt: x.signedAt, executedAt: x.executedAt }
                : x
            )
          );
        }}
      />

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Excluir orçamento"
      >
        <p className="text-zinc-600">
          Tem certeza que deseja excluir este orçamento? Esta ação não pode ser
          desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            isLoading={deleting}
            onClick={() => deleteId && handleDelete(deleteId)}
          >
            Excluir
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={shareBudgetId !== null}
        onClose={() => setShareBudgetId(null)}
        title="Compartilhar orçamento para assinatura"
      >
        {shareBudgetId && (
          <ShareBudget
            budgetId={shareBudgetId}
            onClose={() => setShareBudgetId(null)}
          />
        )}
      </Modal>
    </div>
  );
}
