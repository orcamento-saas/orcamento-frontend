"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import type { ApiError } from "@/lib/api";
import { submitAuthenticatedDoubt, submitPublicDoubt } from "@/services/doubts";

type PanelState = "closed" | "form" | "success";

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    typeof (error as ApiError).message === "string"
  ) {
    return (error as ApiError).message;
  }
  return fallback;
}

export function HelpDoubtWidget() {
  const { accessToken, account } = useAuth();
  const isLoggedIn = Boolean(accessToken && account);

  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (panelState === "closed") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [panelState]);

  const closePanel = () => {
    setPanelState("closed");
    setError(null);
  };

  const openPanel = () => {
    setError(null);
    setPanelState("form");
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setError(null);
  };

  const handleCloseSuccess = () => {
    resetForm();
    setPanelState("closed");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isLoggedIn && accessToken) {
        await submitAuthenticatedDoubt(message.trim(), accessToken);
      } else {
        await submitPublicDoubt({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        });
      }
      setPanelState("success");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível enviar sua dúvida. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  };

  const panelOpen = panelState !== "closed";

  return (
    <>
      {panelOpen && (
        <button
          type="button"
          aria-label="Fechar painel de dúvidas"
          className="fixed inset-0 z-[55] bg-zinc-900/30 backdrop-blur-[1px]"
          onClick={closePanel}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          panelOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!panelOpen}
      >
        <PanelHeader onClose={closePanel} />

        {panelState === "success" ? (
          <DoubtSuccessPanel onClose={handleCloseSuccess} />
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col px-5 pb-6">
            <p className="mt-4 text-sm text-zinc-600">
              {isLoggedIn
                ? "Envie sua dúvida e nossa equipe responderá por e-mail."
                : "Preencha os dados abaixo. Nossa equipe Orçamentos LM responderá por e-mail."}
            </p>

            <DoubtFormFields
              isLoggedIn={isLoggedIn}
              name={name}
              email={email}
              message={message}
              onNameChange={setName}
              onEmailChange={setEmail}
              onMessageChange={setMessage}
            />

            {error && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-auto pt-4">
              <Button type="submit" className="w-full" isLoading={submitting}>
                Enviar
              </Button>
            </div>
          </form>
        )}
      </aside>

      <button
        type="button"
        aria-label="Abrir dúvidas"
        onClick={openPanel}
        className="group fixed bottom-5 right-5 z-[54] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      >
        <span className="relative flex items-center justify-center gap-2 rounded-full bg-violet-600 p-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/35 transition hover:bg-violet-700 hover:shadow-violet-700/40 sm:rounded-2xl sm:rounded-br-md sm:px-4 sm:py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 shrink-0 opacity-95"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.022-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm0 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Dúvidas</span>
        </span>
      </button>
    </>
  );
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
      <h2 className="text-lg font-semibold text-zinc-900">Dúvidas</h2>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}

function DoubtSuccessPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
        <p className="text-base font-semibold text-emerald-900">Mensagem enviada com sucesso!</p>
        <p className="mt-3 text-sm text-emerald-800">
          Em breve você receberá o retorno por e-mail da equipe Orçamentos LM.
        </p>
      </div>
      <div className="mt-auto flex justify-end pt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-xl text-zinc-600 transition hover:bg-zinc-100"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function DoubtFormFields({
  isLoggedIn,
  name,
  email,
  message,
  onNameChange,
  onEmailChange,
  onMessageChange,
}: {
  isLoggedIn: boolean;
  name: string;
  email: string;
  message: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onMessageChange: (value: string) => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      {!isLoggedIn && (
        <>
          <Input
            label="Nome"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Seu nome"
            required
            maxLength={120}
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="seu@email.com"
            required
            maxLength={255}
          />
        </>
      )}
      <div>
        <label htmlFor="doubt-message" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Dúvida
        </label>
        <textarea
          id="doubt-message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Descreva sua dúvida..."
          required
          minLength={5}
          maxLength={5000}
          rows={8}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
        />
      </div>
    </div>
  );
}
