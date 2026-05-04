"use client";

import { useEffect, useState, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneBr, phoneDigits } from "@/lib/formatPhone";
import { formatDateBr } from "@/lib/formatDateBr";
import { updateProfile } from "@/services/account";
import {
  type BillingMethod,
  cancelBillingSubscription,
  createBillingCheckout,
  getBillingSubscriptionSummary,
  type BillingSubscriptionSummary,
} from "@/services/billing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function AccountPage() {
  const router = useRouter();
  const skipStopSavingRef = useRef(false);
  const { account, accessToken, refreshAccount, user } = useAuth();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [billing, setBilling] = useState<BillingSubscriptionSummary | null>(null);
  const [billingErr, setBillingErr] = useState<string | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<BillingMethod>("CREDIT_CARD");

  useEffect(() => {
    const n =
      account?.name ||
      (typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
      "";
    setName(n);
    const p =
      account?.phone ??
      (typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : "") ??
      "";
    setPhone(p ? formatPhoneBr(p.replace(/\D/g, "")) : "");
  }, [account?.name, account?.phone, user?.user_metadata]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setLoadingBilling(true);
    setBillingErr(null);

    void getBillingSubscriptionSummary(accessToken)
      .then((data) => {
        if (active) setBilling(data);
      })
      .catch((e: unknown) => {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Não foi possível carregar os dados da assinatura.";
        if (active) setBillingErr(message);
      })
      .finally(() => {
        if (active) setLoadingBilling(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!accessToken) {
      setErr("Sessão expirada. Entre novamente.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErr("Nome é obrigatório.");
      return;
    }

    const digits = phoneDigits(phone);
    if (digits.length < 10) {
      setErr(
        digits.length === 0
          ? "Telefone é obrigatório."
          : "Telefone inválido. Informe DDD + número (mínimo 10 dígitos)."
      );
      return;
    }

    setSaving(true);
    skipStopSavingRef.current = false;
    try {
      const phonePayload = formatPhoneBr(phone).trim().slice(0, 30);

      await updateProfile(accessToken, {
        name: trimmedName,
        phone: phonePayload,
      });
      await supabase.auth.refreshSession();
      await refreshAccount();

      skipStopSavingRef.current = true;
      startTransition(() => {
        router.replace("/dashboard");
      });
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Não foi possível salvar.";
      setErr(message);
    } finally {
      if (!skipStopSavingRef.current) {
        setSaving(false);
      }
    }
  }

  const inputClass =
    "mt-0.5 w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:px-3 sm:py-2";
  const labelClass = "block text-[10px] font-medium text-zinc-600 sm:text-xs md:text-sm";
  const isPro = (billing?.plan ?? account?.plan) === "PRO";
  const subscriptionStatus = billing?.subscription?.status;
  const isSubscriptionCanceled = subscriptionStatus === "CANCELED";
  /** Ainda dá para pedir cancelamento no Asaas (não confir com assinatura já cancelada). */
  const canRequestCancelPro =
    isPro &&
    Boolean(billing?.subscription) &&
    subscriptionStatus !== "CANCELED";
  /** Fim do acesso Pro (cancelamento, avisos): mantém fallback em paidUntil se o backend só preencheu um dos campos. */
  const accessEnd =
    billing?.subscription?.currentPeriodEnd ??
    billing?.subscription?.paidUntil ??
    null;
  const accessEndTime = accessEnd ? new Date(accessEnd).getTime() : NaN;
  const hasFutureAccessEnd =
    Number.isFinite(accessEndTime) && accessEndTime > Date.now();
  /** Linha de vigência na UI: só currentPeriodEnd (evita confundir com vencimento curto do Asaas no PIX). */
  const currentPeriodEndOnly = billing?.subscription?.currentPeriodEnd ?? null;
  /** Pro ainda válido após pedir cancelamento — não mostrar só "Cancelada" (conflita com o plano). */
  const canceledButProUntilEnd =
    isSubscriptionCanceled && isPro && hasFutureAccessEnd;
  const statusLabel = canceledButProUntilEnd
    ? `Pro ativo até ${formatDateBr(accessEnd)} — renovação cancelada, sem nova cobrança.`
    : `Status: ${formatSubscriptionStatus(
        resolvedSubscriptionStatusForDisplay(billing)
      )}`;
  const billingWindowLabel = canceledButProUntilEnd
    ? null
    : currentPeriodEndOnly
      ? `Vigência do plano Pro até ${formatDateBr(currentPeriodEndOnly)}.`
      : "Data de vigência em sincronização; aguarde alguns minutos ou atualize a página.";
  const billingMethod = billing?.subscription?.billingMethod;
  const showPixVigencyNote =
    isPro &&
    !loadingBilling &&
    !canceledButProUntilEnd &&
    billingMethod === "PIX" &&
    Boolean(currentPeriodEndOnly);

  async function handleUpgradeToPro() {
    if (!accessToken) {
      setBillingErr("Sessão expirada. Entre novamente.");
      return;
    }
    setProcessingCheckout(true);
    setBillingErr(null);
    try {
      const checkout = await createBillingCheckout(accessToken, [checkoutMethod]);
      window.location.href = checkout.checkoutUrl;
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Não foi possível iniciar o checkout.";
      setBillingErr(message);
      setProcessingCheckout(false);
    }
  }

  async function handleCancelPro() {
    if (!accessToken) {
      setBillingErr("Sessão expirada. Entre novamente.");
      return;
    }
    setProcessingCancel(true);
    setBillingErr(null);
    try {
      await cancelBillingSubscription(accessToken);
      await refreshAccount();
      const next = await getBillingSubscriptionSummary(accessToken);
      setBilling(next);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Não foi possível cancelar sua assinatura.";
      setBillingErr(message);
    } finally {
      setProcessingCancel(false);
    }
  }

  function openCancelModal() {
    setIsCancelModalOpen(true);
    setBillingErr(null);
  }

  function closeCancelModal() {
    if (processingCancel) return;
    setIsCancelModalOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-lg pb-2 pt-0 sm:pb-3 sm:pt-1">
      <div className="mb-1 sm:mb-1.5">
        <h1 className="text-sm font-bold text-zinc-900 sm:text-base lg:text-lg">Minha conta</h1>
      </div>

      <Card className="p-3 shadow-sm sm:p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-2.5">
          <div>
            <label htmlFor="acc-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="acc-email"
              type="email"
              value={account?.email ?? ""}
              disabled
              className="mt-0.5 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm text-zinc-600 sm:px-3"
            />
          </div>

          <div>
            <label htmlFor="acc-name" className={labelClass}>
              Nome
              <span className="font-semibold text-red-600"> *</span>
            </label>
            <input
              id="acc-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="acc-phone" className={labelClass}>
              Telefone (WhatsApp)
              <span className="font-semibold text-red-600"> *</span>
            </label>
            <input
              id="acc-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
              required
              placeholder="(99) 99999-9999"
              className={inputClass}
            />
          </div>

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 sm:px-2.5 sm:py-1.5 sm:text-sm">
              {err}
            </div>
          )}
          <div className="pt-0">
            <Button type="submit" variant="success" size="sm" isLoading={saving} className="w-full">
              Salvar dados
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-2 p-3 shadow-sm sm:mt-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold text-zinc-900 sm:text-sm md:text-base">Assinatura</h2>
            <p className="mt-0 text-[11px] text-zinc-600 sm:mt-0.5 sm:text-xs sm:text-sm">
              Plano atual: <span className="font-semibold">{isPro ? "Pro" : "Free"}</span>
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:px-2.5 sm:py-1 sm:text-xs sm:tracking-[0.12em] ${
              isPro ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        {loadingBilling ? (
          <p className="mt-1.5 text-[11px] text-zinc-500 sm:mt-2 sm:text-sm">Carregando assinatura...</p>
        ) : isPro ? (
          <div className="mt-1.5 space-y-0 text-[11px] leading-snug text-zinc-700 sm:mt-2 sm:space-y-0.5 sm:text-sm">
            <p>Forma de pagamento: {formatBillingMethod(billingMethod)}</p>
            <p>{statusLabel}</p>
            {billingWindowLabel ? <p>{billingWindowLabel}</p> : null}
            {showPixVigencyNote ? (
              <p className="mt-1 rounded-lg border border-teal-100 bg-teal-50/80 px-2 py-1.5 text-[10px] leading-snug text-teal-900 sm:text-[11px] sm:text-xs">
                No PIX, cada período é cobrado à parte. A data acima é o fim da vigência atual do plano Pro.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1.5 text-[11px] text-zinc-600 sm:mt-2 sm:text-sm">
            Você não tem assinatura paga ativa no momento.
          </p>
        )}

        {billingErr && (
          <div className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 sm:mt-2 sm:px-2.5 sm:py-1.5 sm:text-sm">
            {billingErr}
          </div>
        )}

        <div className="mt-2 sm:mt-2.5">
          {isPro && canRequestCancelPro && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={processingCancel}
              onClick={openCancelModal}
              className="w-full"
            >
              Cancelar plano Pro
            </Button>
          )}
          {isPro && isSubscriptionCanceled && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900 sm:px-2.5 sm:py-2 sm:text-xs sm:text-sm">
              {canceledButProUntilEnd && accessEnd
                ? `Sem renovação automática. Após ${formatDateBr(accessEnd)}, a conta volta ao plano Free.`
                : "Sua assinatura foi encerrada no provedor de pagamento. Os detalhes do período podem estar sincronizando."}
            </p>
          )}
          {isPro && !canRequestCancelPro && !isSubscriptionCanceled && !loadingBilling && (
            <p className="text-xs text-zinc-500 sm:text-sm">
              Não encontramos uma assinatura ativa para cancelar. Se você usa o Pro, os detalhes
              podem estar sincronizando; tente atualizar a página em instantes.
            </p>
          )}
          {!isPro && (
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-[11px] font-medium text-zinc-700 sm:text-sm">Forma de pagamento</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <label
                  className={`flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
                    checkoutMethod === "CREDIT_CARD"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout-method-account"
                    className="h-4 w-4 shrink-0 border-zinc-300 accent-emerald-600 focus:ring-emerald-500"
                    checked={checkoutMethod === "CREDIT_CARD"}
                    onChange={() => setCheckoutMethod("CREDIT_CARD")}
                  />
                  Cartão
                </label>
                <label
                  className={`flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
                    checkoutMethod === "PIX"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="checkout-method-account"
                    className="h-4 w-4 shrink-0 border-zinc-300 accent-emerald-600 focus:ring-emerald-500"
                    checked={checkoutMethod === "PIX"}
                    onChange={() => setCheckoutMethod("PIX")}
                  />
                  PIX
                </label>
              </div>
              <Button
                type="button"
                variant="success"
                size="sm"
                isLoading={processingCheckout}
                onClick={handleUpgradeToPro}
                className="w-full"
              >
                Obter plano Pro
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={closeCancelModal}
        title="Cancelar plano Pro?"
      >
        <p className="text-sm leading-relaxed text-zinc-700">
          Tem certeza que deseja cancelar sua assinatura? Você perderá a renovação automática e
          continuará com acesso Pro somente até o fim do período já pago.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={closeCancelModal}
            disabled={processingCancel}
          >
            Manter assinatura
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={processingCancel}
            onClick={async () => {
              await handleCancelPro();
              setIsCancelModalOpen(false);
            }}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function resolvedSubscriptionStatusForDisplay(
  b: BillingSubscriptionSummary | null | undefined
): "INACTIVE" | "TRIALING" | "ACTIVE" | "OVERDUE" | "CANCELED" | null | undefined {
  const s = b?.subscription;
  if (!s) return undefined;
  if (s.status === "TRIALING") return "ACTIVE";
  const period = s.currentPeriodEnd ?? s.paidUntil;
  if (b?.plan === "PRO" && period && s.status === "INACTIVE") return "ACTIVE";
  return s.status;
}

function formatSubscriptionStatus(
  status:
    | (BillingSubscriptionSummary["subscription"] extends infer T
        ? T extends { status: infer S }
          ? S
          : never
        : never)
    | null
    | undefined
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

