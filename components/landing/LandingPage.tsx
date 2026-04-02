"use client";

import { useCallback, useRef, useState, type FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildLoginUrl, PLANS_POST_AUTH_PATH } from "@/lib/authRedirect";

type TabId = "features" | "plans";

function DocIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function SignIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

const features: {
  title: string;
  description: string;
  icon: FC;
}[] = [
  {
    title: "Orçamentos em minutos",
    description:
      "Monte propostas com cliente, itens e valores. Menos tempo no formulário, mais tempo vendendo.",
    icon: DocIcon,
  },
  {
    title: "PDF profissional",
    description:
      "Geração automática de documentos prontos para enviar ao cliente, com identidade consistente.",
    icon: PdfIcon,
  },
  {
    title: "Assinatura digital",
    description:
      "Seus clientes assinam online, sem instalar nada. Menos atrito, fechamento mais rápido.",
    icon: SignIcon,
  },
  {
    title: "Status e acompanhamento",
    description:
      "Veja enviados, assinados e executados em um fluxo claro. Menos planilha, mais controle.",
    icon: TrackIcon,
  },
  {
    title: "Dashboard",
    description:
      "Resumo do que importa: evolução dos orçamentos e sinais do que precisa de atenção.",
    icon: ChartIcon,
  },
  {
    title: "Notificações",
    description:
      "No plano Pro, seja avisado quando houver novidades nos seus orçamentos assinados.",
    icon: BellIcon,
  },
];

export function LandingPage() {
  const router = useRouter();
  const mainSectionsRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("features");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadHint, setLeadHint] = useState<string | null>(null);

  /** Troca aba e rola até o bloco principal (header é sticky — precisa de scroll explícito). */
  const goToTabFromNav = useCallback((tab: TabId) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      mainSectionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const goRegister = useCallback(() => {
    const q = new URLSearchParams();
    q.set("mode", "register");
    q.set("next", PLANS_POST_AUTH_PATH);
    if (leadEmail.trim()) q.set("email", leadEmail.trim());
    if (leadName.trim()) q.set("name", leadName.trim());
    router.push(`/login?${q.toString()}`);
  }, [leadEmail, leadName, router]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail.trim())) {
      setLeadHint("Informe um e-mail válido para continuar.");
      return;
    }
    setLeadHint(null);
    goRegister();
  };

  return (
    <div className="min-h-[100svh] bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-8 lg:px-10 xl:px-12">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <span className="relative h-9 w-[120px] shrink-0 sm:h-10 sm:w-[140px]">
              <Image
                src="/plan/logo.png"
                alt="Orçamento LM"
                fill
                className="object-contain object-left"
                sizes="140px"
                priority
              />
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Seções">
            <button
              type="button"
              onClick={() => goToTabFromNav("features")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "features"
                  ? "bg-teal-50 text-teal-800"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              Funcionalidades
            </button>
            <button
              type="button"
              onClick={() => goToTabFromNav("plans")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "plans"
                  ? "bg-teal-50 text-teal-800"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              Planos
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href={buildLoginUrl({ mode: "register", next: PLANS_POST_AUTH_PATH })}
              className="inline-flex items-center rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              Começar grátis
            </Link>
          </div>
        </div>

        <div className="flex border-t border-zinc-100 bg-zinc-50/90 px-4 py-2 sm:hidden">
          <button
            type="button"
            onClick={() => goToTabFromNav("features")}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${
              activeTab === "features" ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
            }`}
          >
            Funcionalidades
          </button>
          <button
            type="button"
            onClick={() => goToTabFromNav("plans")}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${
              activeTab === "plans" ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
            }`}
          >
            Planos
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-900 px-4 pb-16 pt-12 text-white sm:px-5 sm:pb-20 sm:pt-16 md:px-8 lg:px-10 xl:px-12">
        <div
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative w-full">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/90">
            Orçamentos profissionais
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Feche mais vendas com PDF, status e assinatura no mesmo lugar
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-teal-100/95 sm:text-lg">
            Crie, envie e acompanhe orçamentos sem planilhas soltas. Ideal para prestadores e pequenos
            negócios que querem resposta rápida do cliente.
          </p>

          <form
            onSubmit={handleLeadSubmit}
            className="mx-auto mt-10 flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <label className="sr-only" htmlFor="lead-name">
              Nome
            </label>
            <input
              id="lead-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="min-h-[48px] flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-teal-100/70 backdrop-blur-sm outline-none ring-teal-300/50 transition focus:ring-2"
            />
            <label className="sr-only" htmlFor="lead-email">
              E-mail
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="E-mail profissional"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              className="min-h-[48px] flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-teal-100/70 backdrop-blur-sm outline-none ring-teal-300/50 transition focus:ring-2 sm:min-w-[220px]"
            />
            <button
              type="submit"
              className="min-h-[48px] shrink-0 rounded-2xl bg-white px-5 text-sm font-semibold text-teal-800 shadow-lg transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700"
            >
              Quero testar grátis
            </button>
          </form>
          {leadHint ? (
            <p className="mt-2 text-center text-sm text-amber-100" role="status">
              {leadHint}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-teal-100/80">
              Sem cartão para começar no plano Free. Leva menos de 1 minuto.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-teal-100/85 sm:text-sm">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
              Assinatura digital integrada
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
              PDF automático
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
              Dashboard em tempo real
            </span>
          </div>
        </div>
      </section>

      <main
        ref={mainSectionsRef}
        id="funcionalidades-e-planos"
        className="mx-auto w-full max-w-7xl scroll-mt-32 px-4 py-12 sm:scroll-mt-24 sm:px-5 sm:py-16 md:px-8 lg:px-10 xl:px-12"
      >
        <div className="mb-10 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {activeTab === "features" ? "Funcionalidades" : "Planos e preços"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-600 sm:text-base">
              {activeTab === "features"
                ? "Tudo o que você precisa para levar o orçamento do primeiro contato até a assinatura."
                : "Comece grátis e evolua para o Pro quando o volume exigir mais liberdade."}
            </p>
          </div>
          <div className="hidden h-10 items-center rounded-xl bg-zinc-100 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setActiveTab("features")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === "features" ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
              }`}
            >
              Funcionalidades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === "plans" ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
              }`}
            >
              Planos
            </button>
          </div>
        </div>

        {activeTab === "features" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-teal-50 p-3 text-teal-700 transition group-hover:bg-teal-100">
                  <f.icon />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{f.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Plano Free — mesmos itens que /plans */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">Plano Free</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-600">
                    Ideal para testar
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  R$ 0 / mês
                </span>
              </div>

              <p className="mb-3 hidden text-sm text-zinc-600 sm:block">
                Perfeito para criar seus primeiros orçamentos profissionais sem custo.
              </p>

              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Recursos do plano Free
              </div>
              <ul className="mt-2 mb-2 space-y-[6px] text-[11px] text-zinc-700 sm:space-y-3 sm:text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">Todos os templates.</span>
                  <span className="ml-2 font-semibold text-red-400">✕</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Quantidade de orçamentos ilimitados.
                  </span>
                  <span className="ml-2 font-semibold text-red-400">✕</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Gestão de status com notificações.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Assinatura digital integrada.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Notificações de novos orçamentos assinados.
                  </span>
                  <span className="ml-2 font-semibold text-red-400">✕</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Dashboard para acompanhamento.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
              </ul>

              <div className="mt-auto">
                <Link
                  href={buildLoginUrl({ mode: "register", next: PLANS_POST_AUTH_PATH })}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:text-sm"
                >
                  Começar grátis
                </Link>
              </div>
            </div>

            {/* Plano Pro — mesmos itens que /plans */}
            <div className="flex flex-col rounded-2xl border border-teal-500 bg-gradient-to-br from-teal-50 via-white to-emerald-50 p-4 shadow-md shadow-teal-100 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">Plano Pro</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-teal-700">
                    Mais recomendado
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  R$ 19,90 / mês
                </span>
              </div>

              <p className="mb-3 hidden text-sm text-zinc-700 sm:block">
                Para quem quer velocidade e liberdade para seus orçamentos.
              </p>

              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Recursos do plano Pro
              </div>
              <ul className="mt-2 mb-2 space-y-[6px] text-[11px] text-zinc-800 sm:space-y-3 sm:text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">Todos os templates.</span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Quantidade de orçamentos ilimitados.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Gestão de status com notificações.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Assinatura digital integrada.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Notificações de novos orçamentos assinados.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="min-w-0 whitespace-normal break-words">
                    Dashboard para acompanhamento.
                  </span>
                  <span className="ml-2 font-semibold text-emerald-600">✔</span>
                </li>
              </ul>

              <div className="mt-auto">
                <Link
                  href={buildLoginUrl({ next: PLANS_POST_AUTH_PATH })}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:text-sm"
                >
                  Quero plano Pro
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="mt-16 rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm sm:mt-20 sm:py-14">
          <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">Pronto para organizar seus orçamentos?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-600 sm:text-base">
            Cadastre-se grátis e veja na prática como o fluxo de PDF e assinatura simplifica o dia a dia.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={buildLoginUrl({ mode: "register", next: PLANS_POST_AUTH_PATH })}
              className="inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:w-auto"
            >
              Criar conta
            </Link>
            <Link
              href={buildLoginUrl({ next: PLANS_POST_AUTH_PATH })}
              className="inline-flex w-full max-w-xs items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-zinc-500 sm:flex-row sm:px-5 sm:text-left md:px-8 lg:px-10 xl:px-12">
          <p>© 2026 Orçamento LM</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/politica-de-privacidade" className="hover:text-teal-700">
              Privacidade
            </Link>
            <Link href="/termos-de-uso" className="hover:text-teal-700">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
