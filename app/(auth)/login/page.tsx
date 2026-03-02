"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const HIGHLIGHT_MESSAGES = [
  "Crie orçamentos profissionais em poucos cliques e envie PDFs prontos para seus clientes.",
  "Centralize todos os seus orçamentos em um só lugar e acompanhe o status de cada proposta.",
  "Ganhe tempo com modelos prontos, layouts modernos e geração automática de PDF.",
];

type Mode = "login" | "register";

export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const qpMode = searchParams.get("mode");
    if (qpMode === "register" || qpMode === "login") {
      setMode(qpMode);
    }
  }, [searchParams]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHighlightIndex((prev) => (prev + 1) % HIGHLIGHT_MESSAGES.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen items-stretch bg-gradient-to-br from-sky-50 via-sky-100 to-indigo-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white/90 shadow-2xl ring-1 ring-sky-100 backdrop-blur">
        {/* Lado esquerdo: informações da aplicação */}
        <div className="relative hidden w-1/2 flex-col justify-between border-r border-sky-900/60 bg-slate-950 text-slate-50 px-10 py-12 md:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.32),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.32),transparent_55%)]" />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Plataforma de orçamentos em PDF
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-semibold leading-tight text-slate-50 md:text-4xl">
                Organize seus orçamentos com rapidez e profissionalismo.
              </h2>
              <p className="max-w-md text-sm text-slate-200">
                Centralize propostas, acompanhe o status de cada cliente e gere PDFs
                prontos para envio em poucos cliques.
              </p>
            </div>

            <div className="mt-2 rounded-2xl border border-sky-500/30 bg-slate-900/70 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                Sobre a aplicação
              </p>
              <p className="mt-2 text-sm text-slate-100 transition-opacity duration-500">
                {HIGHLIGHT_MESSAGES[highlightIndex]}
              </p>
              <div className="mt-4 flex gap-1.5">
                {HIGHLIGHT_MESSAGES.map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full bg-sky-900/60 ${
                      index === highlightIndex ? "bg-sky-400" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} PDF Orçamento. Todos os direitos
              reservados.
            </p>
          </div>
        </div>

        {/* Lado direito: login / criação de conta */}
        <div className="flex w-full items-center justify-center px-6 py-8 md:w-1/2 md:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {isLogin ? "Entre na sua conta" : "Crie sua conta"}
              </h1>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              {isLogin
                ? "Digite suas credenciais para acessar o painel."
                : "Preencha os dados para começar a usar a plataforma."}
            </p>

            <Card className="border border-slate-200 shadow-sm">
              <form
                onSubmit={isLogin ? handleLogin : handleRegister}
                className="space-y-4"
              >
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="voce@empresa.com"
                />
                <Input
                  label="Senha"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
                />
                {!isLogin && (
                  <Input
                    label="Confirmar senha"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a senha"
                  />
                )}
                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={loading}
                >
                  {isLogin ? "Entrar" : "Cadastrar"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-600">
                {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(isLogin ? "register" : "login")}
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {isLogin ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

