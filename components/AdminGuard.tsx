"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center py-8">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-200/60">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
            Acesso restrito
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
            Esta área é exclusiva para administradores
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Seu usuário não tem permissão para gerenciar contas, planos e suspensões da plataforma.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Voltar ao dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
