"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentAccount } from "@/services/account";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function handleAuthCallback() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }

          if (data.session?.access_token) {
            // Forca sincronizacao/criacao do usuario no backend logo apos confirmacao.
            await getCurrentAccount(data.session.access_token);
          }
        } else if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type:
              type === "signup" ||
              type === "recovery" ||
              type === "invite" ||
              type === "email" ||
              type === "email_change"
                ? type
                : "signup",
          });

          if (error) {
            throw error;
          }

          if (data.session?.access_token) {
            await getCurrentAccount(data.session.access_token);
          }
        }
      } catch {
        // Em caso de falha, segue para login para nao quebrar a experiencia.
      } finally {
        try {
          await supabase.auth.signOut();
        } catch {
          // best effort
        }

        if (!cancelled) {
          router.replace("/login?confirmed=1");
        }
      }
    }

    void handleAuthCallback();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Confirmando sua conta...</h1>
        <p className="mt-2 text-sm text-zinc-600">Aguarde, voce sera redirecionado para o login.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">Confirmando sua conta...</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Aguarde, voce sera redirecionado para o login.
            </p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
