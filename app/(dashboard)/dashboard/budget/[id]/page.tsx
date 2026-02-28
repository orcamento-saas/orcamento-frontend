"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getBudget,
  generatePdf,
  deleteBudget,
} from "@/services/budgets";
import type { Budget } from "@/types/budget";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ShareBudget } from "@/components/ShareBudget";
import type { ApiError } from "@/lib/api";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function DashboardBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { accessToken } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    getBudget(id, accessToken)
      .then(setBudget)
      .catch((err: ApiError) => {
        setError(err.status === 404 ? "Orçamento não encontrado." : err.message);
      })
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  const handleGeneratePdf = async () => {
    if (!accessToken || !id) return;
    setGeneratingPdf(true);
    try {
      const updated = await generatePdf(id, accessToken);
      setBudget(updated);
    } catch (err) {
      const e = err as ApiError;
      alert(e.message ?? "Erro ao gerar PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    setDeleting(true);
    try {
      await deleteBudget(id, accessToken);
      router.push("/dashboard");
      router.refresh();
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

  if (error || !budget) {
    return (
      <Card className="py-12 text-center">
        <p className="text-zinc-600">{error ?? "Orçamento não encontrado."}</p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button>Voltar ao dashboard</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-zinc-900">{budget.title}</span>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{budget.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={budget.status} />
            </div>
            {budget.description && (
              <p className="mt-3 text-zinc-600">{budget.description}</p>
            )}
            <p className="mt-4 text-2xl font-semibold text-zinc-900">
              {formatCurrency(budget.value)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {budget.pdfUrl && (
              <>
                <a
                  href={budget.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm">
                    Ver PDF
                  </Button>
                </a>
                <a href={budget.pdfUrl} download>
                  <Button variant="secondary" size="sm">
                    Baixar PDF
                  </Button>
                </a>
              </>
            )}
            {budget.status === "DRAFT" && (
              <Button
                size="sm"
                isLoading={generatingPdf}
                onClick={handleGeneratePdf}
              >
                Gerar PDF
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShareOpen(true)}
            >
              Compartilhar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              Excluir
            </Button>
          </div>
        </div>
        {budget.signedPdfUrl && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <a
              href={budget.signedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Ver PDF assinado
            </a>
          </div>
        )}
      </Card>

      <Modal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Compartilhar orçamento"
      >
        <ShareBudget budgetId={budget.id} onClose={() => setShareOpen(false)} />
      </Modal>

      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir orçamento"
      >
        <p className="text-zinc-600">
          Tem certeza que deseja excluir este orçamento? Esta ação não pode ser
          desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            isLoading={deleting}
            onClick={handleDelete}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
