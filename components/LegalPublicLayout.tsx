import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  children: ReactNode;
};

export function LegalPublicLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/login" className="text-sm font-medium text-teal-600 hover:text-teal-700">
            ← Voltar ao login
          </Link>
          <Link href="/login" className="shrink-0" aria-label="Ir para o login">
            <img src="/plan/logo.png" alt="Orçamento LM" className="h-8 w-auto object-contain opacity-90" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
        <div className="mt-8 text-base leading-relaxed text-zinc-700 [&_h2]:scroll-mt-20 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_p]:mt-2">
          {children}
        </div>
      </main>
    </div>
  );
}
