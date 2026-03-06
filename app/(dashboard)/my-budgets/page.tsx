"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getBudgets, deleteBudget } from "@/services/budgets";
import type { Budget } from "@/types/budget";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { ApiError } from "@/lib/api";

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

/** Exibe a data do documento ou data de criação como fallback */
function getDisplayDate(budget: Budget): string {
  if (budget.documentDate) {
    // Usa a mesma lógica do BudgetPdfPreview para evitar problemas de timezone
    const dateStr = budget.documentDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return formatDateShort(budget.createdAt);
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });
  }
  return formatDateShort(budget.createdAt);
}

function matchesSearch(b: Budget, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.trim().toLowerCase();
  const title = (b.title ?? "").toLowerCase();
  const description = (b.description ?? "").toLowerCase();
  const clientName = (b.clientName ?? "").toLowerCase();
  return title.includes(q) || description.includes(q) || clientName.includes(q);
}

const btnBase =
  "inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 h-7 w-7 sm:h-8 sm:w-8 [&_svg]:size-4 [&_svg]:shrink-0 sm:[&_svg]:size-5";
const btnPurple =
  "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500";
const btnBlue =
  "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500";
const btnGreen =
  "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500";
const btnYellow =
  "cursor-not-allowed bg-amber-400 text-white opacity-90";
const btnDisabled =
  "cursor-not-allowed bg-zinc-300 text-zinc-500 opacity-60";

const IconVerPdf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const IconAssinado = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
);
const IconAbrir = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
);
const IconExcluir = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

export default function MyBudgetsPage() {
  const { accessToken } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [signedFilter, setSignedFilter] = useState<"all" | "signed" | "unsigned">("all");

  useEffect(() => {
    if (!accessToken) return;
    getBudgets(accessToken)
      .then((res) => {
        setBudgets(res.data);
        setTotal(res.total);
      })
      .catch((err: ApiError) => {
        setError(err.message ?? "Erro ao carregar orçamentos.");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filteredBudgets = useMemo(() => {
    let list = budgets.filter((b) => matchesSearch(b, search));
    if (signedFilter === "signed") list = list.filter((b) => !!b.signedPdfUrl);
    if (signedFilter === "unsigned") list = list.filter((b) => !b.signedPdfUrl);
    return list;
  }, [budgets, search, signedFilter]);

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-zinc-900">Meus orçamentos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} {total === 1 ? "orçamento" : "orçamentos"} no total
        </p>
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
          onChange={(e) => setSignedFilter(e.target.value as "all" | "signed" | "unsigned")}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          aria-label="Filtrar por assinatura"
        >
          <option value="all">Todos</option>
          <option value="signed">Assinados</option>
          <option value="unsigned">Sem assinatura</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 shrink-0 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                  <div className="flex flex-col gap-3 sm:gap-4 rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <StatusBadge status={b.status} />
                        {!b.signedPdfUrl && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 sm:px-2">
                            Não assinado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-900 sm:text-base sm:font-semibold">
                        {b.clientName ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600 sm:mt-1 sm:text-sm">
                        {b.title ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-700 sm:mt-1 sm:text-sm">
                        Total {formatCurrency(b.value)} - {getDisplayDate(b)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {b.pdfUrl && (
                        <>
                          <a
                            href={b.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${btnBase} ${btnPurple}`}
                            title="Ver PDF"
                          >
                            <IconVerPdf />
                          </a>
                          <a
                            href={b.pdfUrl}
                            download
                            className={`${btnBase} ${btnPurple}`}
                            title="Baixar PDF"
                          >
                            <IconDownload />
                          </a>
                        </>
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
                      <Link
                        href={`/dashboard/budget/${b.id}`}
                        className={`${btnBase} ${btnBlue}`}
                        title="Abrir"
                      >
                        <IconAbrir />
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        className="h-7 w-7 shrink-0 p-0 sm:h-8 sm:w-8 [&_svg]:size-4 [&_svg]:shrink-0 sm:[&_svg]:size-5"
                        onClick={() => setDeleteId(b.id)}
                        title="Excluir"
                      >
                        <IconExcluir />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

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
    </div>
  );
}
