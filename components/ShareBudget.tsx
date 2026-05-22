"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildBudgetShareMessage,
  plainTextToClipboardHtml,
} from "@/lib/budgetShare";
import { Button } from "@/components/ui/Button";

interface ShareBudgetProps {
  budgetId: string;
  title: string;
  value: number;
  clientName?: string | null;
  companyName?: string | null;
  senderName?: string | null;
  onClose?: () => void;
}

async function copyMessageToClipboard(plain: string): Promise<void> {
  const html = plainTextToClipboardHtml(plain);

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard?.write &&
    typeof ClipboardItem !== "undefined"
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return;
    } catch {
      // fallback abaixo
    }
  }

  await navigator.clipboard.writeText(plain);
}

export function ShareBudget({
  budgetId,
  title,
  value,
  clientName,
  companyName,
  senderName,
  onClose,
}: ShareBudgetProps) {
  const [copied, setCopied] = useState(false);

  const defaultMessage = useMemo(
    () =>
      buildBudgetShareMessage({
        budgetId,
        title,
        value,
        clientName,
        companyName,
        senderName,
      }),
    [budgetId, title, value, clientName, companyName, senderName]
  );

  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);

  const copyMessage = () => {
    void copyMessageToClipboard(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    `Orçamento — ${title.trim() || "proposta"}`
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-medium text-zinc-700">
            Mensagem para enviar
          </label>
          <button
            type="button"
            onClick={() => setMessage(defaultMessage)}
            className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
          >
            Restaurar texto padrão
          </button>
        </div>
        <textarea
          rows={12}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800"
          aria-label="Mensagem do orçamento para copiar ou enviar"
        />
        <div className="mt-3 flex flex-col gap-3">
          <Button
            onClick={copyMessage}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
          >
            {copied ? "Copiado!" : "Copiar mensagem"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0"
            >
              <Button
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
              >
                Abrir WhatsApp
              </Button>
            </a>
            <a href={mailtoUrl} className="min-w-0">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm">
                Enviar por e-mail
              </Button>
            </a>
          </div>
          {onClose && (
            <div className="flex justify-center pt-1">
              <Button
                onClick={onClose}
                className="min-w-[8rem] bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
