"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) router.replace("/dashboard");
      });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-primary-50/30 p-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Orçamento SaaS
        </h1>
        <p className="mt-2 text-zinc-600">
          Crie e compartilhe orçamentos de forma simples. Gere PDFs e colete
          assinaturas dos clientes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Criar conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
