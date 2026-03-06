"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicBudget, signBudget } from "@/services/budgets";
import type { PublicBudgetView } from "@/types/budget";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { SignatureCanvas } from "@/components/SignatureCanvas";
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
function getDisplayDate(budget: PublicBudgetView): string {
  if (budget.documentDate) {
    // Usa a mesma lógica do BudgetPdfPreview para evitar problemas de timezone
    const dateStr = budget.documentDate;
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return formatDateShort(budget.createdAt);
    }
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return formatDateShort(budget.createdAt);
    const [, y, m, d] = match;
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });
  }
  return formatDateShort(budget.createdAt);
}

export default function PublicBudgetPage() {
  const params = useParams();
  const id = params.id as string;
  const [budget, setBudget] = useState<PublicBudgetView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPublicBudget(id)
      .then((data) => {
        setBudget(data);
        setSigned(data.status === "SIGNED");
      })
      .catch((err: ApiError) => {
        if (err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!budget) return;
    if (!clientName.trim()) {
      setSubmitError("Informe seu nome.");
      return;
    }
    if (!clientEmail.trim()) {
      setSubmitError("Informe seu e-mail.");
      return;
    }
    if (!signatureDataUrl) {
      setSubmitError("Desenhe sua assinatura no quadro.");
      return;
    }
    const base64 = signatureDataUrl.includes(",")
      ? signatureDataUrl.split(",")[1]
      : signatureDataUrl;
    setSubmitting(true);
    try {
      const updated = await signBudget(id, {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        signatureImageBase64: base64,
      });
      setBudget(updated);
      setSigned(true);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) {
        setSubmitError("Este orçamento já foi assinado.");
        setSigned(true);
      } else {
        setSubmitError(apiErr.message ?? "Erro ao enviar assinatura.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-primary-50/20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !budget) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-primary-50/20 p-6">
        <Card className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-zinc-900">
            Orçamento não encontrado
          </h1>
          <p className="mt-2 text-zinc-600">
            O link pode estar incorreto ou o orçamento foi removido.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-primary-50/20">
      <div className="mx-auto max-w-lg px-3 py-2 sm:px-4">
        <Card className="mb-3 py-3 px-4 bg-teal-50">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={budget.status} />
          </div>
          <p className="mt-2 font-semibold text-zinc-900 text-sm">
            {budget.clientName ?? "—"}
          </p>
          <p className="mt-1 text-base font-medium text-zinc-800">
            {budget.title}
          </p>
          <p className="mt-1 text-xs text-zinc-700">
            Total {formatCurrency(budget.value)} - {getDisplayDate(budget)}
          </p>
          {!signed && budget.pdfUrl && (
            <div className="mt-2">
              <a
                href={budget.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
                >
                  Ver orçamento
                </Button>
              </a>
            </div>
          )}
          {budget.signedPdfUrl && (
            <div className="mt-2">
              <a
                href={budget.signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="sm" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm">
                  Abrir PDF assinado
                </Button>
              </a>
            </div>
          )}
        </Card>

        {signed ? (
          <Card className="border-emerald-200 bg-teal-50 py-3 px-4">
            <h2 className="text-base font-semibold text-emerald-900">
              Assinatura enviada
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              O orçamento foi assinado com sucesso. Obrigado!
            </p>
          </Card>
        ) : (
          <Card className="py-3 px-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Assinar orçamento
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Preencha os dados e desenhe sua assinatura abaixo.
            </p>
            <form onSubmit={handleSubmit} className="mt-3 space-y-2">
              <Input
                label="Nome"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                placeholder="Seu nome completo"
              />
              <Input
                label="E-mail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
              <div>
                <label className="mb-0.5 block text-xs font-medium text-zinc-700">
                  Assinatura
                </label>
                <SignatureCanvas
                  onSignatureChange={setSignatureDataUrl}
                  width={400}
                  height={100}
                />
              </div>
              {submitError && (
                <p className="rounded-lg bg-red-50 p-1.5 text-xs text-red-700">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
                size="lg"
                isLoading={submitting}
              >
                Enviar assinatura
              </Button>
            </form>
          </Card>
        )}

        <p className="mt-2 text-center">
          <Button size="sm" onClick={() => window.close()} className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm">
            Fechar
          </Button>
        </p>
      </div>
    </div>
  );
}
