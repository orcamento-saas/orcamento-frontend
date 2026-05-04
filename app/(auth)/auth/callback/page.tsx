"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeNextPath,
} from "@/lib/authRedirect";
import { getCurrentAccount } from "@/services/account";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const nextDest = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;

    async function handleAuthCallback() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      let shouldSignOut = false;
      let redirectPath = nextDest ?? DEFAULT_POST_LOGIN_PATH;

      try {
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }

          if (data.session?.access_token) {
            // OAuth (incluindo Google) não deve deslogar mesmo se a API interna falhar.
            shouldSignOut = false;
            redirectPath = nextDest ?? DEFAULT_POST_LOGIN_PATH;

            try {
              // Forca sincronizacao/criacao do usuario no backend logo apos autenticacao.
              await getCurrentAccount(data.session.access_token);
            } catch {
              // Best effort: falha na sincronizacao nao deve invalidar a sessao OAuth.
            }
          }
        } else if (tokenHash && type) {
          // Fluxo de confirmacao por e-mail / recuperacao de senha.
          shouldSignOut = true;
          redirectPath = "/login?confirmed=1";
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
        } else {
          // Fallback para provedores OAuth: algumas respostas chegam sem query visivel.
          const { data } = await supabase.auth.getSession();
          if (!data.session?.access_token) {
            redirectPath = "/login";
            return;
          }
          try {
            await getCurrentAccount(data.session.access_token);
          } catch {
            // Best effort
          }
        }
      } catch {
        // Em caso de falha, segue para login para nao quebrar a experiencia.
        redirectPath = "/login";
      } finally {
        if (shouldSignOut) {
          try {
            await supabase.auth.signOut();
          } catch {
            // best effort
          }
        }

        if (!cancelled) {
          router.replace(redirectPath);
        }
      }
    }

    void handleAuthCallback();

    return () => {
      cancelled = true;
    };
  }, [nextDest, router, searchParams, supabase]);

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
