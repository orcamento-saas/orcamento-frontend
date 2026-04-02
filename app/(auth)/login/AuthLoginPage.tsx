"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { primeAuthStateAfterPasswordLogin } from "@/hooks/useAuth";
import {
  DEFAULT_POST_LOGIN_PATH,
  getSafeNextPath,
} from "@/lib/authRedirect";
import { formatPhoneBr, phoneDigits } from "@/lib/formatPhone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type Mode = "login" | "register" | "forgot";

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.84 21.84 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.85 21.85 0 0 1-3.38 4.62" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextDest = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams]
  );

  /** Troca rota em /login mantendo `next` (fluxo planos / captura). */
  const replaceLoginPreserveNext = useCallback(
    (extra: Record<string, string> = {}) => {
      const q = new URLSearchParams(extra);
      if (nextDest) q.set("next", nextDest);
      const s = q.toString();
      router.replace(s ? `/login?${s}` : "/login", { scroll: false });
    },
    [router, nextDest]
  );

  /** Já autenticado e veio com destino: vai direto (ex.: /plans). */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session?.user || !nextDest) return;
      router.replace(nextDest);
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, nextDest]);

  // Garante que ao abrir /login?mode=register a tela já venha em "Criar conta"
  const [mode, setMode] = useState<Mode>(() => {
    const qpMode = searchParams.get("mode");
    if (qpMode === "register" || qpMode === "forgot") return qpMode;
    return "login";
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const pdfFeatures = [
    {
      title: "Crie orçamentos em poucos minutos",
      description:
        "Preencha apenas o essencial: cliente, itens e valores. O PDF profissional é gerado automaticamente.",
      highlight: "",
      value: "",
      imageSrc: "/plan/1%20imagem.png",
    },
    {
      title: "Envie e acompanhe em um só lugar",
      description:
        "Visualize o status de cada orçamento, saiba quais foram assinados e marque os executados.",
      highlight: "",
      value: "",
      imageSrc: "/plan/2%20imagem.png",
    },
    {
      title: "Evolua para o Pro quando fizer sentido",
      description:
        "Desbloqueie templates premium e geração ilimitada de PDFs quando seu volume de orçamentos crescer.",
      highlight: "",
      value: "",
      imageSrc: "/plan/3%20imagem.png",
    },
    {
      title: "Acompanhe a evolução dos seus orçamentos",
      description:
        "Veja em um dashboard prático e simples como estão os orçamentos enviados, assinados e concluídos ao longo do tempo.",
      highlight: "",
      value: "",
      imageSrc: "/plan/4%20imagem.png",
    },
    {
      title: "Assinatura digital sem complicação",
      description:
        "Seus clientes assinam o orçamento de forma online, sem burocracia e sem precisar instalar nada, acelerando o fechamento das propostas.",
      highlight: "",
      value: "",
      imageSrc: "/plan/5%20imagem.png",
    },
  ];

  useEffect(() => {
    const qpMode = searchParams.get("mode");
    if (qpMode === "register" || qpMode === "forgot") {
      setMode(qpMode);
    } else {
      setMode("login");
    }
  }, [searchParams]);

  useEffect(() => {
    const qpEmail = searchParams.get("email");
    const qpName = searchParams.get("name");
    if (qpEmail?.trim()) setEmail((prev) => prev || qpEmail.trim());
    if (qpName?.trim()) setName((prev) => prev || qpName.trim());
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("reset") !== "success") return;
    setSuccess("Senha alterada com sucesso. Entre com a nova senha.");
    setError(null);
    replaceLoginPreserveNext({});
  }, [searchParams, replaceLoginPreserveNext]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % pdfFeatures.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [pdfFeatures.length]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(err.message);
        return;
      }
      if (!data.session) {
        setError("Sessão indisponível. Tente novamente.");
        return;
      }

      await primeAuthStateAfterPasswordLogin(data.session);
      router.push(nextDest ?? DEFAULT_POST_LOGIN_PATH);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Nome é obrigatório.");
      return;
    }
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
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
          data: {
            name: normalizedName,
            phone: formatPhoneBr(phone).trim().slice(0, 30),
          },
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        router.push(nextDest ?? DEFAULT_POST_LOGIN_PATH);
        router.refresh();
        return;
      }

      setSuccess("Conta criada. Verifique seu e-mail e confirme para entrar.");
      setMode("login");
      replaceLoginPreserveNext({});
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSuccess(
        "Se houver uma conta com este e-mail, você receberá um link para redefinir a senha. Verifique a caixa de entrada e o spam."
      );
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";
  const isForgot = mode === "forgot";
  const isRegister = mode === "register";

  return (
    <div className="flex min-h-[100svh] flex-col bg-gray-50 overflow-hidden lg:min-h-screen lg:flex-row">
      {/* Topo mobile: logo (cadastro com menos espaço até o formulário) */}
      <div
        className={`flex w-full flex-col items-center justify-start px-5 pt-0 pb-0 text-center lg:hidden -mt-6 ${
          isRegister ? "-mb-10" : isForgot ? "pb-2" : ""
        }`}
      >
        <img
          src="/plan/logo.png"
          alt="Logo"
          className={`mx-auto mt-0 object-contain ${
            isRegister
              ? "mb-0 h-[180px] w-[180px]"
              : isForgot
                ? "mb-8 h-[220px] w-[220px]"
                : "mb-0 h-[220px] w-[220px]"
          }`}
        />
      </div>

      {/* Lado esquerdo: informações e recursos */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-green-800 relative">
        <div className="flex flex-col justify-center items-center w-full px-8 py-16">

          {/* Main content - centralizado */}
          <div className="max-w-md mx-auto text-center">
            {/* Feature card animado */}
            <div className="bg-transparent rounded-2xl p-8 mb-8 min-h-[280px] flex flex-col justify-center transition-all duration-2000">
              <div className="mb-6">
                <img
                  src={pdfFeatures[currentSlide].imageSrc}
                  alt=""
                  className="mx-auto mb-4 h-28 w-28 rounded-3xl object-cover"
                />
                <h3 className="text-xl font-bold text-white mb-3">
                  {pdfFeatures[currentSlide].title}
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {pdfFeatures[currentSlide].description}
                </p>
              </div>
              
              {(pdfFeatures[currentSlide].value ||
                pdfFeatures[currentSlide].highlight) && (
                <div className="mt-4 pt-4 border-t-0">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white/80 text-sm">
                        {pdfFeatures[currentSlide].value}
                      </span>
                    </div>
                    <span className="text-white font-semibold">
                      {pdfFeatures[currentSlide].highlight}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Descrição da aplicação */}
            <div className="mb-6">
              <p className="text-white/80 leading-relaxed text-lg">
                A solução completa para geração de PDFs profissionais e gestão de orçamentos
              </p>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center space-x-2 mt-6">
              {pdfFeatures.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-700 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito: formulário de login */}
      <div className="flex flex-1 w-full flex-col justify-center px-5 pt-0 pb-4 sm:px-8 sm:py-8 lg:flex-none lg:h-auto lg:w-1/2 lg:px-16 lg:py-1 lg:justify-start">
        <div className="mx-auto w-full max-w-sm">
          {/* Título */}
          <div className={isForgot ? "mb-4 lg:mb-6" : "mb-1"}>
            <img
              src="/plan/logo.png"
              alt="Logo"
              className={`mx-auto hidden object-contain lg:block ${
                isLogin && !isForgot
                  ? "mb-0 h-[300px] w-[300px] lg:-mt-3 lg:-mb-6"
                  : isForgot
                    ? "mb-8 mt-0 h-[240px] w-[240px] lg:mb-10 lg:mt-2"
                    : "mb-0 h-[240px] w-[240px] lg:-mt-3 lg:-mb-20"
              }`}
            />
            <h2
              className={`text-2xl font-bold text-gray-900 ${
                isForgot ? "mt-2 lg:mt-4" : ""
              }`}
            >
              {isForgot
                ? "Recuperar senha"
                : isLogin
                  ? "Entrar"
                  : "Criar conta"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {isForgot ? (
                <>
                  Digite o e-mail da sua conta. Se existir cadastro, enviaremos o link para redefinir a
                  senha.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setMode("login");
                      replaceLoginPreserveNext({});
                    }}
                    className="font-medium text-teal-600 hover:text-teal-500"
                  >
                    Voltar ao login
                  </button>
                </>
              ) : isLogin ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setMode("register");
                      replaceLoginPreserveNext({ mode: "register" });
                    }}
                    className="font-medium text-teal-600 hover:text-teal-500"
                  >
                    Criar conta agora
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setMode("login");
                      replaceLoginPreserveNext({});
                    }}
                    className="font-medium text-teal-600 hover:text-teal-500"
                  >
                    Entrar agora
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Formulário */}
          <form
            onSubmit={
              isLogin ? handleLogin : isRegister ? handleRegister : handleForgotPassword
            }
            className="space-y-4"
          >
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}

            {isRegister && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (WhatsApp)
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
                  required
                  placeholder="(99) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="exemplo@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {(isLogin || isRegister) && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <span className="ml-2 text-gray-600">Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  className="text-teal-600 hover:text-teal-500"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setMode("forgot");
                    replaceLoginPreserveNext({ mode: "forgot" });
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isLogin
                  ? "Entrando..."
                  : isForgot
                    ? "Enviando..."
                    : "Criando conta..."
                : isLogin
                  ? "Entrar"
                  : isForgot
                    ? "Enviar instruções"
                    : "Criar conta"}
            </button>

            {isLogin && (
              <p className="pt-2 text-center text-sm text-gray-500">
                <Link
                  href="/politica-de-privacidade"
                  className="text-gray-500 transition-colors hover:text-gray-600"
                >
                  Política de privacidade
                </Link>
                <span className="text-gray-400" aria-hidden>
                  {" "}-{" "}
                </span>
                <Link
                  href="/termos-de-uso"
                  className="text-gray-500 transition-colors hover:text-gray-600"
                >
                  Termos de uso
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

