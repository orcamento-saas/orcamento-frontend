"use client";

import { useEffect, useState } from "react";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Orçamentos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} {total === 1 ? "orçamento" : "orçamentos"} no total
          </p>
        </div>
        <Link href="/create-budget">
          <Button size="lg">Novo orçamento</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {budgets.length === 0 && !error && (
        <Card className="py-12 text-center">
          <p className="text-zinc-500">Nenhum orçamento ainda.</p>
          <Link href="/create-budget" className="mt-4 inline-block">
            <Button>Criar primeiro orçamento</Button>
          </Link>
        </Card>
      )}

      {budgets.length > 0 && (
        <ul className="space-y-4">
          {budgets.map((b) => (
            <li key={b.id}>
              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/budget/${b.id}`}
                      className="font-semibold text-zinc-900 hover:text-primary-600"
                    >
                      {b.title}
                    </Link>
                    <StatusBadge status={b.status} />
                  </div>
                  {b.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {b.description}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-zinc-700">
                    {formatCurrency(b.value)} · {formatDate(b.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {b.pdfUrl && (
                    <>
                      <a
                        href={b.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Ver PDF
                      </a>
                      <a
                        href={b.pdfUrl}
                        download
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                      >
                        Baixar
                      </a>
                    </>
                  )}
                  {b.signedPdfUrl && (
                    <a
                      href={b.signedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      PDF assinado
                    </a>
                  )}
                  <Link href={`/dashboard/budget/${b.id}`}>
                    <Button variant="secondary" size="sm">
                      Abrir
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteId(b.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

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
