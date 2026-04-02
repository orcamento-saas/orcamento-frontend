"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getBillingSubscriptionSummary,
  type BillingSubscriptionSummary,
} from "@/services/billing";
import { formatDateBr } from "@/lib/formatDateBr";

type UrlCheckoutOutcome = "cancelled" | "expired" | "success" | "unknown";

type DisplayMode =
  | "loading"
  | "cancelled"
  | "expired"
  | "incomplete"
  | "pending"
  | "paid"
  | "error";

export default function BillingReturnPage() {
  return (
    <Suspense fallback={<BillingReturnFallback />}>
      <BillingReturnContent />
    </Suspense>
  );
}

function BillingReturnFallback() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center px-6 py-8">
      <h1 className="text-center text-2xl font-semibold text-zinc-900">Retorno do checkout</h1>
      <p className="mt-3 text-center text-sm text-zinc-600">
        Verificando o status da sua assinatura...
      </p>
    </main>
  );
}

function BillingReturnContent() {
  const params = useSearchParams();
  const { accessToken } = useAuth();
  const [billing, setBilling] = useState<BillingSubscriptionSummary | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [billingErr, setBillingErr] = useState<string | null>(null);

  const urlOutcome = useMemo((): UrlCheckoutOutcome => {
    const checkout = (params.get("checkout") ?? "").toLowerCase();
    const status = (params.get("status") ?? "").toLowerCase();
    if (checkout === "cancelled" || status === "cancelled" || status === "canceled") {
      return "cancelled";
    }
    if (checkout === "expired" || status === "expired") return "expired";
    if (checkout === "success") return "success";
    return "unknown";
  }, [params]);

  const displayMode = useMemo((): DisplayMode => {
    if (urlOutcome === "cancelled") return "cancelled";
    if (urlOutcome === "expired") return "expired";
    if (billingErr) return "error";
    if (loadingBilling) return "loading";

    const isPaid = billing?.plan === "PRO";
    if (urlOutcome === "success") {
      return isPaid ? "paid" : "pending";
    }
    if (isPaid) return "paid";
    return "incomplete";
  }, [urlOutcome, loadingBilling, billingErr, billing?.plan]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    const pollTimerIds: number[] = [];
    const clearPollTimers = () => {
      pollTimerIds.forEach((id) => window.clearTimeout(id));
      pollTimerIds.length = 0;
    };

    const loadBilling = async (): Promise<boolean> => {
      setLoadingBilling(true);
      setBillingErr(null);
      try {
        const summary = await getBillingSubscriptionSummary(accessToken);
        if (!active) return false;
        setBilling(summary);
        return summary.plan === "PRO";
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Não foi possível carregar os dados da assinatura.";
        if (active) setBillingErr(message);
        return false;
      } finally {
        if (active) setLoadingBilling(false);
      }
    };

    void (async () => {
      const isProNow = await loadBilling();
      if (!active) return;
      if (isProNow) return;

      const shouldPoll = urlOutcome === "success" || urlOutcome === "unknown";
      if (!shouldPoll) return;

      for (const ms of [3000, 7000, 12000]) {
        const id = window.setTimeout(() => {
          if (!active) return;
          void (async () => {
            const ok = await loadBilling();
            if (ok) clearPollTimers();
          })();
        }, ms);
        pollTimerIds.push(id);
      }
    })();

    return () => {
      active = false;
      clearPollTimers();
    };
  }, [accessToken, urlOutcome]);

  const isPro = billing?.plan === "PRO";
  const periodEnd = billing?.subscription?.currentPeriodEnd ?? billing?.subscription?.paidUntil ?? null;
  const statusLabel = formatSubscriptionStatus(resolvedSubscriptionStatusForDisplay(billing));
  const billingWindowLabel = `Renovação / vigência: até ${formatDateBr(periodEnd)}.`;

  const { title, subtitle } = pageCopy(displayMode);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center px-6 py-8">
      <h1 className="text-center text-2xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-3 text-center text-sm text-zinc-600">{subtitle}</p>

      {displayMode === "error" && billingErr && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {billingErr}
        </p>
      )}

      {(displayMode === "paid" || displayMode === "pending" || displayMode === "loading") && (
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">Dados da compra</h2>
          {displayMode === "pending" && (
            <p className="mt-2 text-sm text-amber-800">
              Aguardando confirmação do pagamento no sistema. Você pode aguardar nesta página ou voltar
              depois em Minha conta.
            </p>
          )}
          {loadingBilling ? (
            <p className="mt-2 text-sm text-zinc-600">Carregando dados da assinatura...</p>
          ) : billingErr ? (
            <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {billingErr}
            </p>
          ) : displayMode === "paid" || displayMode === "pending" ? (
            <div className="mt-3 space-y-1.5 text-sm text-zinc-700">
              <p>
                Plano: <span className="font-semibold">{isPro ? "Pro" : "Free"}</span>
              </p>
              <p>Forma de pagamento: {formatBillingMethod(billing?.subscription?.billingMethod)}</p>
              <p>{`Status: ${statusLabel}`}</p>
              <p>{billingWindowLabel}</p>
            </div>
          ) : null}
        </section>
      )}

      {(displayMode === "cancelled" || displayMode === "expired" || displayMode === "incomplete") && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/plans"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Ver planos
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Ir para Minha conta
          </Link>
        </div>
      )}

      {(displayMode === "paid" || displayMode === "pending" || displayMode === "loading" || displayMode === "error") && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Ir para Minha conta
          </Link>
        </div>
      )}
    </main>
  );
}

/** Evita "Pro + Inativa" quando o pagamento já criou período vigente mas o status ainda não alinhou (ou após fix de webhook). */
function resolvedSubscriptionStatusForDisplay(
  b: BillingSubscriptionSummary | null | undefined
): "INACTIVE" | "TRIALING" | "ACTIVE" | "OVERDUE" | "CANCELED" | null | undefined {
  const s = b?.subscription;
  if (!s) return undefined;
  if (s.status === "TRIALING") return "ACTIVE";
  const period = s.currentPeriodEnd ?? s.paidUntil;
  if (b.plan === "PRO" && period && s.status === "INACTIVE") return "ACTIVE";
  return s.status;
}

function pageCopy(mode: DisplayMode): { title: string; subtitle: string } {
  switch (mode) {
    case "loading":
      return {
        title: "Retorno do checkout",
        subtitle: "Verificando o status da sua assinatura...",
      };
    case "cancelled":
      return {
        title: "Checkout cancelado",
        subtitle: "Você saiu do pagamento antes de concluir. Nenhuma cobrança foi registrada.",
      };
    case "expired":
      return {
        title: "Checkout expirado",
        subtitle: "Esta sessão de pagamento não está mais válida. Você pode tentar novamente quando quiser.",
      };
    case "incomplete":
      return {
        title: "Pagamento não concluído",
        subtitle:
          "Não encontramos um plano Pro ativo após o retorno. Se você não finalizou o checkout ou usou voltar no navegador, nenhuma cobrança foi feita por aqui.",
      };
    case "pending":
      return {
        title: "Pagamento em confirmação",
        subtitle: "O pagamento pode levar alguns instantes para aparecer na sua conta.",
      };
    case "paid":
      return {
        title: "Pagamento enviado",
        subtitle: "Recebemos o pagamento. Abaixo você pode acompanhar os dados da sua assinatura.",
      };
    case "error":
      return {
        title: "Não foi possível carregar",
        subtitle: "Tente novamente em instantes ou acesse Minha conta.",
      };
  }
}

function formatSubscriptionStatus(
  status: "INACTIVE" | "TRIALING" | "ACTIVE" | "OVERDUE" | "CANCELED" | null | undefined
): string {
  switch (status) {
    case "ACTIVE":
      return "Ativa";
    case "TRIALING":
      return "Ativa";
    case "OVERDUE":
      return "Inadimplente";
    case "CANCELED":
      return "Cancelada";
    case "INACTIVE":
      return "Inativa";
    default:
      return "Sem assinatura";
  }
}

function formatBillingMethod(method: "CREDIT_CARD" | "PIX" | null | undefined): string {
  if (method === "CREDIT_CARD") return "Cartão de crédito";
  if (method === "PIX") return "PIX";
  return "Não informado";
}

