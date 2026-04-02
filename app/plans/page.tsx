"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createBillingCheckout, type BillingMethod } from "@/services/billing";
import type { ApiError } from "@/lib/api";
import { buildLoginUrl, PLANS_POST_AUTH_PATH } from "@/lib/authRedirect";

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

    if (!accessToken) {
      router.push(buildLoginUrl({ next: PLANS_POST_AUTH_PATH }));
      return;
    }

    setUpgradeLoading(true);
    try {
      const result = await createBillingCheckout(accessToken, [checkoutMethod]);
      window.location.href = result.checkoutUrl;
    } catch (err) {
      const apiErr = err as ApiError;
      setUpgradeError(apiErr.message ?? "Não foi possível iniciar o checkout.");
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="flex h-[100svh] flex-col bg-gray-50 overflow-hidden lg:h-screen lg:flex-row">
      {/* Lado esquerdo: destaque visual, seguindo o estilo do login */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-green-800 relative">
        <div className="flex flex-col justify-center items-center w-full px-10 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="grid grid-cols-1 gap-4 text-left text-sm text-white/90">
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
                      className="mt-1 h-20 w-20 rounded-3xl object-cover"
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
      <div className="flex w-full flex-col justify-center px-5 pt-1 pb-8 sm:px-8 sm:py-8 lg:w-1/2 lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-1 text-center sm:mb-2 md:mb-3">
            <img
              src="/plan/logo.png"
              alt="Logo"
              className="mx-auto h-10 w-auto max-w-[180px] object-contain lg:hidden"
            />
            <img
              src="/plan/logo.png"
              alt="Logo"
              className="mx-auto mb-0 hidden h-[280px] w-[280px] object-contain lg:block lg:-mt-14 lg:-mb-24"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Plano Free */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900">
                    Plano Free
                  </h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-600">
                    Ideal para testar
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  R$ 0 / mês
                </span>
              </div>

              <p className="hidden sm:block mb-3 text-sm text-zinc-600">
                Perfeito para criar seus primeiros orçamentos profissionais sem
                custo.
              </p>

              <div className="mt-0 mb-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Recursos do plano Free
              </div>
              <ul className="mt-2 mb-2 space-y-[6px] sm:space-y-3 text-[11px] text-zinc-700 sm:text-sm">
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

              <div className="mt-auto">
                <Link
                  href={buildLoginUrl({ mode: "register", next: PLANS_POST_AUTH_PATH })}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  Começar grátis
                </Link>
              </div>
            </div>

            {/* Plano Pro */}
            <div className="flex flex-col rounded-2xl border border-teal-500 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4 sm:p-5 shadow-md shadow-teal-100">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900">
                    Plano Pro
                  </h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-700">
                    Mais recomendado
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  R$ 19,90 / mês
                </span>
              </div>

              <p className="hidden sm:block mb-3 text-sm text-zinc-700">
                Para quem quer velocidade e liberdade para seus orçamentos.
              </p>

              <div className="mb-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Recursos do plano Pro
              </div>
              <ul className="mt-2 mb-2 space-y-[6px] sm:space-y-3 text-[11px] text-zinc-800 sm:text-sm">
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

              <div className="mt-auto">
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-zinc-700">Forma de pagamento</p>
                  <div className="flex flex-wrap gap-2">
                    <label
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium ${
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
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium ${
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

          <div className="mt-6 text-center text-xs text-zinc-500">
            <p>
              Já tem uma conta?{" "}
              <Link
                href={buildLoginUrl({ next: PLANS_POST_AUTH_PATH })}
                className="font-semibold text-teal-700 hover:underline"
              >
                Acesse aqui
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

