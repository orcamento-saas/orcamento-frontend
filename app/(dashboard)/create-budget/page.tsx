"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createBudget } from "@/services/budgets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { ApiError } from "@/lib/api";

const TEMPLATE_OPTIONS = [
  { value: "default", label: "Padrão" },
  { value: "minimal", label: "Minimal" },
  { value: "detailed", label: "Detalhado" },
];

export default function CreateBudgetPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState("default");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numValue = parseFloat(value.replace(/\D/g, "").replace(",", ".")) / 100;
    if (!title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    if (isNaN(numValue) || numValue <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    if (!accessToken) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }
    setLoading(true);
    try {
      const budget = await createBudget(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          templateType,
          value: numValue,
        },
        accessToken
      );
      router.push(`/dashboard/budget/${budget.id}`);
      router.refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Erro ao criar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  function formatMoneyInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "");
    const n = parseInt(v, 10) / 100;
    if (isNaN(n)) setValue("");
    else setValue(n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">
        Criar orçamento
      </h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Ex: Orçamento Site Institucional"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              placeholder="Detalhes do serviço ou escopo"
            />
          </div>
          <Input
            label="Valor (R$)"
            value={value}
            onChange={formatMoneyInput}
            placeholder="0,00"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Template
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={loading} className="flex-1">
              Criar orçamento
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Voltar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
