"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, isSuspended, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (isSuspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 shadow-lg shadow-zinc-200/70">
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Conta suspensa
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
            Seu acesso foi pausado
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Entre em contato com o administrador da plataforma para regularizar o acesso antes de continuar usando o sistema.
          </p>
          <div className="mt-6">
            <Button onClick={() => void signOut()} variant="secondary" className="w-full">
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
