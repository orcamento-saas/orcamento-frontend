"use client";

import { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Classes extras no painel (ex.: max-w-lg) */
  panelClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  panelClassName = "",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl sm:p-5 ${panelClassName}`.trim()}
      >
        <h2
          id="modal-title"
          className="text-base font-semibold text-zinc-900 sm:text-lg"
        >
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
