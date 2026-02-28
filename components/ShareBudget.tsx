"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ShareBudgetProps {
  budgetId: string;
  onClose?: () => void;
}

function getPublicUrl(budgetId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/budget/${budgetId}`;
}

export function ShareBudget({ budgetId, onClose }: ShareBudgetProps) {
  const [copied, setCopied] = useState(false);
  const url = getPublicUrl(budgetId);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Confira seu orçamento: ${url}`
  )}`;

  const mailtoUrl = `mailto:?subject=Orçamento&body=${encodeURIComponent(
    `Confira seu orçamento pelo link: ${url}`
  )}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Link público
        </label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={url}
            className="flex-1 bg-zinc-50 text-sm"
          />
          <Button variant="secondary" onClick={copyLink}>
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm">
            WhatsApp
          </Button>
        </a>
        <a href={mailtoUrl}>
          <Button variant="secondary" size="sm">
            Enviar por e-mail
          </Button>
        </a>
      </div>
      {onClose && (
        <div className="pt-2">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
