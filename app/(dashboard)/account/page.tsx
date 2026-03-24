"use client";

import { useEffect, useState, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneBr, phoneDigits } from "@/lib/formatPhone";
import { updateProfile } from "@/services/account";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AccountPage() {
  const router = useRouter();
  const skipStopSavingRef = useRef(false);
  const { account, accessToken, refreshAccount, user } = useAuth();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const n =
      account?.name ||
      (typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
      "";
    setName(n);
    const p =
      account?.phone ??
      (typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : "") ??
      "";
    setPhone(p ? formatPhoneBr(p.replace(/\D/g, "")) : "");
  }, [account?.name, account?.phone, user?.user_metadata]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!accessToken) {
      setErr("Sessão expirada. Entre novamente.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErr("Nome é obrigatório.");
      return;
    }

    const digits = phoneDigits(phone);
    if (digits.length < 10) {
      setErr(
        digits.length === 0
          ? "Telefone é obrigatório."
          : "Telefone inválido. Informe DDD + número (mínimo 10 dígitos)."
      );
      return;
    }

    setSaving(true);
    skipStopSavingRef.current = false;
    try {
      const phonePayload = formatPhoneBr(phone).trim().slice(0, 30);

      await updateProfile(accessToken, {
        name: trimmedName,
        phone: phonePayload,
      });
      await supabase.auth.refreshSession();
      await refreshAccount();

      skipStopSavingRef.current = true;
      startTransition(() => {
        router.replace("/dashboard");
      });
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Não foi possível salvar.";
      setErr(message);
    } finally {
      if (!skipStopSavingRef.current) {
        setSaving(false);
      }
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";
  const labelClass = "block text-xs font-medium text-zinc-600 sm:text-sm";

  return (
    <div className="mx-auto w-full max-w-lg pb-6 pt-2 sm:pt-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">Minha conta</h1>
      </div>

      <Card className="p-5 shadow-sm sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="acc-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="acc-email"
              type="email"
              value={account?.email ?? ""}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
            />
          </div>

          <div>
            <label htmlFor="acc-name" className={labelClass}>
              Nome
              <span className="font-semibold text-red-600"> *</span>
            </label>
            <input
              id="acc-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="acc-phone" className={labelClass}>
              Telefone (WhatsApp)
              <span className="font-semibold text-red-600"> *</span>
            </label>
            <input
              id="acc-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
              required
              placeholder="(11) 98765-4321"
              className={inputClass}
            />
          </div>

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:text-sm">
              {err}
            </div>
          )}
          <div className="pt-2 sm:pt-3">
            <Button type="submit" size="sm" isLoading={saving} className="w-full">
              Salvar dados
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
