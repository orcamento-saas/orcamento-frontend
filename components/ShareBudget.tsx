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

  const mailtoUrl = `mailto:?subject=Orçamentos LM&body=${encodeURIComponent(
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
          <Button onClick={copyLink} className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm">
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm">
            WhatsApp
          </Button>
        </a>
        <a href={mailtoUrl}>
          <Button size="sm" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm">
            Enviar por e-mail
          </Button>
        </a>
      </div>
      {onClose && (
        <div className="pt-2">
          <Button onClick={onClose} className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm">
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
