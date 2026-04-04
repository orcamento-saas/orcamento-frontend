"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createBillingCheckout, type BillingMethod } from "@/services/billing";
import { ApiRequestError, type ApiError } from "@/lib/api";
import { buildLoginUrl, PLANS_POST_AUTH_PATH } from "@/lib/authRedirect";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const BILLING_CHECKOUT_CONFLICT_CODES = new Set([
  "BILLING_ALREADY_PRO",
  "BILLING_SUBSCRIPTION_ALREADY_ACTIVE",
]);

function billingCheckoutConflictTitle(code?: string): string {
  if (code === "BILLING_SUBSCRIPTION_ALREADY_ACTIVE") {
    return "Assinatura em andamento";
  }
  return "Você já possui o plano Pro";
}

/** Evita repetir no corpo do modal a mesma frase já usada no título. */
function billingCheckoutConflictBody(code: string | undefined, apiMessage: string): string {
  const msg = apiMessage.trim();
  if (code !== "BILLING_ALREADY_PRO") {
    return msg;
  }
  const lead = /^Você já possui o plano Proo?\.?\s*/i;
  const withoutLead = msg.replace(lead, "").trim();
  return withoutLead.length > 0 ? withoutLead : msg;
}

type PlansLeftFeature = {
  imageSrc: string;
  title: string;
  description: string;
};

const plansLeftFeatures: PlansLeftFeature[] = [
  {
    imageSrc: "/plan/1%20imagem.png",
    title: "Crie orçamentos em poucos minutos",
    description:
      "Preencha apenas o essencial: cliente, itens e valores. O PDF profissional é gerado automaticamente.",
  },
  {
    imageSrc: "/plan/2%20imagem.png",
    title: "Envie e acompanhe em um só lugar",
    description:
      "Visualize o status de cada orçamento, saiba quais foram assinados e marque os executados.",
  },
  {
    imageSrc: "/plan/3%20imagem.png",
    title: "Evolua para o Pro quando fizer sentido",
    description:
      "Desbloqueie templates premium e geração ilimitada de PDFs quando seu volume de orçamentos crescer.",
  },
  {
    imageSrc: "/plan/4%20imagem.png",
    title: "Acompanhe a evolução dos seus orçamentos",
    description:
      "Veja em um dashboard prático e simples como estão os orçamentos enviados, assinados e concluídos ao longo do tempo.",
  },
  {
    imageSrc: "/plan/5%20imagem.png",
    title: "Assinatura digital sem complicação",
    description:
      "Seus clientes assinam o orçamento de forma online, sem burocracia e sem precisar instalar nada, acelerando o fechamento das propostas.",
  },
];

export default function PlansPage() {
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [checkoutNoticeModal, setCheckoutNoticeModal] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<BillingMethod>("CREDIT_CARD");
  const router = useRouter();
  const { accessToken } = useAuth();

  useEffect(() => {
    const revealMs = 900;
    const pauseMs = 350;
    const stepMs = revealMs + pauseMs;
    const startDelayMs = 200;

    let cancelled = false;
    let timer: number | undefined;

    const tick = (i: number) => {
      if (cancelled) return;
      setVisibleIndex(i);

      if (i + 1 < plansLeftFeatures.length) {
        timer = window.setTimeout(() => tick(i + 1), stepMs);
      }
    };

    timer = window.setTimeout(() => tick(0), startDelayMs);

    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  async function handleUpgradeClick(): Promise<void> {
    setUpgradeError(null);
    setCheckoutNoticeModal(null);

    if (!accessToken) {
      router.push(buildLoginUrl({ next: PLANS_POST_AUTH_PATH }));
      return;
    }

    setUpgradeLoading(true);
    try {
      const result = await createBillingCheckout(accessToken, [checkoutMethod]);
      window.location.href = result.checkoutUrl;
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        err.status === 409 &&
        err.code &&
        BILLING_CHECKOUT_CONFLICT_CODES.has(err.code)
      ) {
        setCheckoutNoticeModal({
          title: billingCheckoutConflictTitle(err.code),
          message: billingCheckoutConflictBody(err.code, err.message),
        });
      } else {
        const apiErr = err as ApiError;
        setUpgradeError(apiErr.message ?? "Não foi possível iniciar o checkout.");
      }
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-gray-50 lg:flex-row">
      {/* Lado esquerdo: destaque visual, seguindo o estilo do login */}
      <div className="hidden min-h-0 lg:flex lg:w-1/2 lg:flex-col lg:bg-gradient-to-br lg:from-teal-600 lg:via-teal-700 lg:to-green-800">
        <div className="flex min-h-0 flex-1 flex-col justify-center px-8 py-6">
          <div className="mx-auto max-w-md text-center">
            <div className="grid grid-cols-1 gap-2.5 text-left text-xs text-white/90 xl:gap-3 xl:text-sm">
              {plansLeftFeatures.map((f, idx) => {
                const isVisible = idx <= visibleIndex;
                return (
                  <div
                    key={f.imageSrc}
                    className={`flex items-center gap-3 transition-all duration-[900ms] ease-out ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                    }`}
                  >
                    <img
                      src={f.imageSrc}
                      alt=""
                      className="mt-0.5 h-14 w-14 shrink-0 rounded-2xl object-cover xl:h-16 xl:w-16"
                    />
                    <div>
                      <p className="font-semibold">{f.title}</p>
                      <p className="text-white/80">{f.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito: cards de planos + comparação */}
      <div className="flex min-h-0 w-full flex-1 flex-col justify-center overflow-hidden px-4 pb-3 pt-2 sm:px-5 sm:pb-4 lg:w-1/2 lg:px-8 lg:pb-5 lg:pt-3">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-col justify-center">
          <div className="mb-2 shrink-0 text-center sm:mb-2.5 lg:mb-3 lg:pt-0">
            <img
              src="/plan/logo.png"
              alt="Logo"
              className="mx-auto h-9 w-auto max-w-[160px] object-contain sm:h-10 sm:max-w-[180px] lg:hidden"
            />
            <img
              src="/plan/logo.png"
              alt="Logo"
              className="mx-auto hidden h-[4.5rem] w-auto max-w-[200px] object-contain sm:h-[5rem] lg:block xl:h-[5.5rem]"
            />
          </div>

          <div className="grid min-h-0 shrink gap-3 sm:gap-3.5 md:grid-cols-2 md:gap-4">
            {/* Plano Free */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-2 flex items-center justify-between sm:mb-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 sm:text-base lg:text-lg">
                    Plano Free
                  </h3>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-teal-600 sm:text-xs sm:tracking-[0.2em]">
                    Ideal para testar
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs">
                  R$ 0 / mês
                </span>
              </div>

              <p className="mb-2 hidden text-xs text-zinc-600 sm:block sm:text-sm">
                Perfeito para criar seus primeiros orçamentos profissionais sem
                custo.
              </p>

              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-[11px] sm:tracking-[0.2em]">
                Recursos do plano Free
              </div>
              <ul className="mb-1 mt-1.5 space-y-1 text-[11px] text-zinc-700 sm:mb-2 sm:mt-2 sm:space-y-1.5 sm:text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Todos os templates.
                  </span>
                  <span className="ml-2 text-red-400 font-semibold">✕</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Quantidade de orçamentos ilimitados.
                  </span>
                  <span className="ml-2 text-red-400 font-semibold">✕</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Gestão de status com notificações.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Assinatura digital integrada.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Notificações de novos orçamentos assinados.
                  </span>
                  <span className="ml-2 text-red-400 font-semibold">✕</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Dashboard para acompanhamento.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
              </ul>

              <div className="mt-auto pt-1">
                <Link
                  href={buildLoginUrl({ mode: "register", next: PLANS_POST_AUTH_PATH })}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:text-sm"
                >
                  Começar grátis
                </Link>
              </div>
            </div>

            {/* Plano Pro */}
            <div className="flex flex-col rounded-2xl border border-teal-500 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-3 shadow-md shadow-teal-100 sm:p-4">
              <div className="mb-2 flex items-center justify-between sm:mb-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 sm:text-base lg:text-lg">
                    Plano Pro
                  </h3>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-teal-700 sm:text-xs sm:tracking-[0.2em]">
                    Mais recomendado
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-xs">
                  R$ 19,90 / mês
                </span>
              </div>

              <p className="mb-2 hidden text-xs text-zinc-700 sm:block sm:text-sm">
                Para quem quer velocidade e liberdade para seus orçamentos.
              </p>

              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 sm:text-[11px] sm:tracking-[0.2em]">
                Recursos do plano Pro
              </div>
              <ul className="mb-1 mt-1.5 space-y-1 text-[11px] text-zinc-800 sm:mb-2 sm:mt-2 sm:space-y-1.5 sm:text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Todos os templates.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Quantidade de orçamentos ilimitados.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Gestão de status com notificações.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Assinatura digital integrada.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Notificações de novos orçamentos assinados.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Dashboard para acompanhamento.
                  </span>
                  <span className="ml-2 text-emerald-600 font-semibold">✔</span>
                </li>
              </ul>

              <div className="mt-auto pt-1">
                <div className="mb-2">
                  <p className="mb-1.5 text-xs font-medium text-zinc-700">Forma de pagamento</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <label
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium sm:py-2 ${
                        checkoutMethod === "CREDIT_CARD"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="checkout-method-plans"
                        className="h-4 w-4 shrink-0 border-zinc-300 accent-emerald-600 focus:ring-emerald-500"
                        checked={checkoutMethod === "CREDIT_CARD"}
                        onChange={() => setCheckoutMethod("CREDIT_CARD")}
                      />
                      Cartão
                    </label>
                    <label
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium sm:py-2 ${
                        checkoutMethod === "PIX"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="checkout-method-plans"
                        className="h-4 w-4 shrink-0 border-zinc-300 accent-emerald-600 focus:ring-emerald-500"
                        checked={checkoutMethod === "PIX"}
                        onChange={() => setCheckoutMethod("PIX")}
                      />
                      PIX
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={upgradeLoading}
                  onClick={() => {
                    void handleUpgradeClick();
                  }}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {upgradeLoading ? "Iniciando checkout..." : "Quero plano Pro"}
                </button>
                {upgradeError ? (
                  <p className="mt-2 text-xs text-red-600">{upgradeError}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-2 shrink-0 pb-0.5 text-center text-[11px] text-zinc-500 sm:mt-3 sm:text-xs lg:mt-3.5">
            <p>
              {accessToken ? (
                <>
                  Já está logado?{" "}
                  <Link
                    href="/dashboard"
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    Ir para o painel
                  </Link>
                  .
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <Link
                    href={buildLoginUrl({ next: PLANS_POST_AUTH_PATH })}
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    Acesse aqui
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={checkoutNoticeModal !== null}
        onClose={() => setCheckoutNoticeModal(null)}
        title={checkoutNoticeModal?.title ?? ""}
      >
        {checkoutNoticeModal ? (
          <>
            <p className="text-sm leading-relaxed text-zinc-600">
              {checkoutNoticeModal.message}
            </p>
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="success"
                onClick={() => setCheckoutNoticeModal(null)}
              >
                Entendi
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}

