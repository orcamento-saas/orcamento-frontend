"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900">{budget.title}</h1>
            <StatusBadge status={budget.status} />
          </div>
          {budget.description && (
            <p className="mt-3 text-zinc-600">{budget.description}</p>
          )}
          <p className="mt-4 text-2xl font-semibold text-zinc-900">
            {formatCurrency(budget.value)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {budget.pdfUrl && (
              <a
                href={budget.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Ver PDF
              </a>
            )}
            {budget.signedPdfUrl && (
              <a
                href={budget.signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Ver PDF assinado
              </a>
            )}
          </div>
        </Card>

        {signed ? (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <h2 className="text-lg font-semibold text-emerald-900">
              Assinatura recebida
            </h2>
            <p className="mt-2 text-emerald-800">
              O orçamento foi assinado com sucesso. Obrigado!
            </p>
            {budget.signedPdfUrl && (
              <a
                href={budget.signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block"
              >
                <Button size="sm">Abrir PDF assinado</Button>
              </a>
            )}
          </Card>
        ) : (
          <Card>
            <h2 className="text-lg font-semibold text-zinc-900">
              Assinar orçamento
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Preencha os dados e desenhe sua assinatura abaixo.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Assinatura
                </label>
                <SignatureCanvas
                  onSignatureChange={setSignatureDataUrl}
                  width={400}
                  height={180}
                />
              </div>
              {submitError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={submitting}
              >
                Enviar assinatura
              </Button>
            </form>
          </Card>
        )}

        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-700">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
