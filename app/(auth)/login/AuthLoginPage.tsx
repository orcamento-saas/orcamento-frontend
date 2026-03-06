 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type Mode = "login" | "register";

export function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const pdfFeatures = [
    {
      title: "Crie Orçamentos Profissionais",
      description: "Transforme suas propostas em PDFs elegantes e personalizáveis com a identidade da sua empresa.",
      highlight: "Ilimitados",
      value: "PDFs gerados"
    },
    {
      title: "Gestão Completa de Clientes",
      description: "Organize seus clientes, acompanhe o status de cada orçamento e nunca perca uma oportunidade.",
      highlight: "100%",
      value: "Organizado"
    },
    {
      title: "Assinatura Digital Integrada",
      description: "Seus clientes podem assinar os orçamentos diretamente no sistema, agilizando todo o processo.",
      highlight: "Digital",
      value: "Assinatura"
    }
  ];

  useEffect(() => {
    const qpMode = searchParams.get("mode");
    if (qpMode === "register" || qpMode === "login") {
      setMode(qpMode);
    }
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % pdfFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [pdfFeatures.length]);

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Lado esquerdo: informações e recursos */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-green-800 relative">
        <div className="flex flex-col justify-center items-center w-full px-8 py-16">
          {/* Título no topo centralizado */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              <span className="bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Orçamento já
              </span>
            </h1>
          </div>

          {/* Main content - centralizado */}
          <div className="max-w-md mx-auto text-center">
            {/* Feature card animado */}
            <div className="bg-gray-50 rounded-2xl p-8 mb-8 min-h-[280px] flex flex-col justify-center transition-all duration-500">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {pdfFeatures[currentSlide].title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {pdfFeatures[currentSlide].description}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600 text-sm">{pdfFeatures[currentSlide].value}</span>
                  </div>
                  <span className="text-gray-800 font-semibold">{pdfFeatures[currentSlide].highlight}</span>
                </div>
              </div>
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
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito: formulário de login */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Título */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? "Entrar" : "Criar conta"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin 
                ? "Não tem uma conta? " 
                : "Já tem uma conta? "
              }
              <button
                type="button"
                onClick={() => setMode(isLogin ? "register" : "login")}
                className="font-medium text-teal-600 hover:text-teal-500"
              >
                {isLogin ? "Criar agora" : "Entrar agora"}
              </button>
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <span className="ml-2 text-gray-600">Lembrar de mim</span>
                </label>
                <button type="button" className="text-teal-600 hover:text-teal-500">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isLogin ? "Entrando..." : "Criando conta...") 
                : (isLogin ? "Entrar" : "Criar conta")
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

