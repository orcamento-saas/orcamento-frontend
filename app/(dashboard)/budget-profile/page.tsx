"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackendTemplatePreview } from "@/components/BackendTemplatePreview";
import { LogoEditorModal } from "@/components/LogoEditorModal";
import {
  getBudgetProfile,
  updateBudgetProfile,
} from "@/services/account";
import { getBudgetPreviewHtml } from "@/services/budgets";
import type { LayoutId } from "@/lib/budgetLayouts";

function ColorPaletteRow({
  label,
  value,
  onChange,
  colors,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colors: string[];
  disabled: boolean;
}) {
  const normalizedValue = value.toLowerCase();
  return (
    <div>
      <label className="mb-2 block text-center text-sm font-medium text-zinc-700">{label}</label>
      <div className="mb-2 flex flex-wrap justify-center gap-1.5">
        {colors.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            disabled={disabled}
            className={`h-8 w-8 shrink-0 rounded-md border-2 shadow-sm transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
              normalizedValue === hex.toLowerCase()
                ? "border-zinc-900 ring-2 ring-zinc-400"
                : "border-zinc-300 hover:border-zinc-400"
            }`}
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}

function MobileColorDropdown({
  label,
  value,
  onChange,
  colors,
  isOpen,
  onToggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colors: string[];
  isOpen: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <label className="mb-1 block text-center text-xs font-medium text-zinc-700">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="h-8 w-full min-w-[60px] rounded-md border border-zinc-300 px-2 shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: value }}
      >
        <svg
          className={`ml-auto h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: value === "#ffffff" ? "#000" : "#fff" }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        className={`absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-zinc-300 bg-white p-2 shadow-lg transition-all duration-200 ease-in-out ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1">
          {colors.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => {
                onChange(hex);
                onToggle();
              }}
              disabled={disabled}
              className={`h-6 w-full rounded border-2 transition-all duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
                value.toLowerCase() === hex.toLowerCase()
                  ? "border-zinc-900 ring-1 ring-zinc-400"
                  : "border-zinc-300 hover:border-zinc-400"
              }`}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileTemplateDropdown({
  value,
  onChange,
  options,
  isOpen,
  onToggle,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  isOpen: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];
  return (
    <div className="relative">
      <label className="mb-1 block text-center text-xs font-medium text-zinc-700">Template</label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex h-8 w-[130px] items-center justify-between rounded-md border border-zinc-300 bg-white px-2 shadow-sm transition-all duration-200 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate text-xs text-zinc-700">{selectedOption?.label ?? "Simples"}</span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        className={`absolute left-0 top-full z-10 mt-1 w-[130px] rounded-md border border-zinc-300 bg-white shadow-lg transition-all duration-200 ease-in-out ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled || option.disabled}
            onClick={() => {
              onChange(option.value);
              onToggle();
            }}
            className={`w-full px-3 py-2 text-left text-xs transition-all duration-150 first:rounded-t-md last:rounded-b-md ${
              value === option.value ? "bg-zinc-100 font-medium" : ""
            } ${disabled || option.disabled ? "cursor-not-allowed text-zinc-400" : "hover:bg-zinc-50"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function getTodayISO(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MAX_LOGO_PX = 2048;

function resizeLogoIfNeeded(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w <= MAX_LOGO_PX && h <= MAX_LOGO_PX) {
        resolve(dataUrl);
        return;
      }

      const ratio = Math.min(MAX_LOGO_PX / w, MAX_LOGO_PX / h);
      const cw = Math.round(w * ratio);
      const ch = Math.round(h * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = dataUrl;
  });
}

export default function BudgetProfilePage() {
  const { accessToken, plan } = useAuth();
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [validityDays, setValidityDays] = useState<string>("15");
  const [fontColor, setFontColor] = useState("#20b2aa");
  const [backgroundColor, setBackgroundColor] = useState("#e0f7fa");
  const [gridColor, setGridColor] = useState("#20b2aa");
  const [templateId, setTemplateId] = useState<LayoutId | "">("simples");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendPreviewHtml, setBackendPreviewHtml] = useState("");
  const [backendPreviewLoading, setBackendPreviewLoading] = useState(false);
  const [backendPreviewError, setBackendPreviewError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"form" | "preview">("form");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [logoPendingDataUrl, setLogoPendingDataUrl] = useState<string | null>(null);
  const [logoPendingFileName, setLogoPendingFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canEdit = plan === "PRO";
  const canUsePremiumTemplates = plan === "PRO";
  const effectiveTemplateId: LayoutId = (templateId || "simples") as LayoutId;
  const isModernLikeTemplate =
    effectiveTemplateId === "moderno" ||
    effectiveTemplateId === "profissional" ||
    effectiveTemplateId === "simples";

  const fontColors = [
    "#3b82f6",
    "#20b2aa",
    "#ef4444",
    "#f59e0b",
    "#6b7280",
    "#8b5cf6",
    "#000000",
    "#ffffff",
  ];

  const backgroundColors = [
    "#dbeafe",
    "#e0f7fa",
    "#fee2e2",
    "#fef9c3",
    "#f3f4f6",
    "#ede9fe",
    "#e5e5e5",
    "#ffffff",
  ];

  const gridColors = [
    "#3b82f6",
    "#20b2aa",
    "#ef4444",
    "#f59e0b",
    "#6b7280",
    "#8b5cf6",
    "#000000",
    "#ffffff",
  ];

  const templateOptions: Array<{ value: LayoutId; label: string; disabled?: boolean }> = [
    { value: "simples", label: "Simples" },
    {
      value: "moderno",
      label: canUsePremiumTemplates ? "Moderno" : "Moderno (visualizar)",
      disabled: false,
    },
    {
      value: "profissional",
      label: canUsePremiumTemplates ? "Profissional" : "Profissional (visualizar)",
      disabled: false,
    },
  ];

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setLoading(true);
    setError(null);

    void getBudgetProfile(accessToken)
      .then((response) => {
        if (!active || !response.profile) return;
        const profile = response.profile;
        setCompanyLogoUrl(profile.companyLogoUrl ?? "");
        setLogoFileName(profile.companyLogoUrl?.startsWith("data:") ? "Logo selecionada" : "");
        setCompanyName(profile.companyName ?? "");
        setCompanyAddress(profile.companyAddress ?? "");
        setCompanyPhone(profile.companyPhone ?? "");
        setCompanyCnpj(profile.companyCnpj ?? "");
        setValidityDays(profile.validityDays != null && profile.validityDays > 0 ? String(profile.validityDays) : "");
        setFontColor(profile.fontColor ?? "#20b2aa");
        setBackgroundColor(profile.backgroundColor ?? "#e0f7fa");
        setGridColor(profile.gridColor ?? "#20b2aa");
        const nextTemplate = profile.templateId;
        if (
          nextTemplate === "simples" ||
          nextTemplate === "moderno" ||
          nextTemplate === "profissional"
        ) {
          setTemplateId(nextTemplate);
        } else {
          setTemplateId("");
        }
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Não foi possível carregar o perfil padrão.";
        if (active) setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setBackendPreviewLoading(true);
      setBackendPreviewError(null);
      try {
        const validity = validityDays.trim() === "" ? 0 : Number(validityDays);
        const response = await getBudgetPreviewHtml({
          title: companyName.trim() ? `Orçamento - ${companyName.trim()}` : "Orçamento",
          value: 1500,
          companyLogoUrl: companyLogoUrl.trim() || undefined,
          companyName: companyName.trim() || undefined,
          companyAddress: companyAddress.trim() || undefined,
          companyPhone: companyPhone.trim() || undefined,
          companyCnpj: companyCnpj.trim() || undefined,
          clientName: "Cliente exemplo",
          clientEmail: "cliente@exemplo.com",
          clientPhone: "(11) 90000-0000",
          clientAddress: "Endereço do cliente",
          documentDate: getTodayISO(),
          validityDays: Number.isFinite(validity) && validity > 0 ? validity : undefined,
          items: [
            {
              description: "Serviço exemplo",
              quantity: 1,
              unitPrice: 1500,
            },
          ],
          fontColor,
          backgroundColor,
          gridColor,
          templateId: effectiveTemplateId,
        });

        if (!cancelled) {
          setBackendPreviewHtml(response.html);
        }
      } catch {
        if (!cancelled) {
          setBackendPreviewError("Não foi possível carregar a prévia do template selecionado.");
        }
      } finally {
        if (!cancelled) {
          setBackendPreviewLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    companyLogoUrl,
    companyName,
    companyAddress,
    companyPhone,
    companyCnpj,
    validityDays,
    fontColor,
    backgroundColor,
    gridColor,
    effectiveTemplateId,
  ]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes((file.type || "").toLowerCase())) {
      setError("Use uma imagem JPEG, PNG, GIF ou WebP.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result.startsWith("data:image/")) {
        setError("Não foi possível processar essa imagem.");
        setLogoUploading(false);
        return;
      }
      resizeLogoIfNeeded(result)
        .then((dataUrl) => {
          setLogoPendingDataUrl(dataUrl);
          setLogoPendingFileName(file.name);
          setLogoModalOpen(true);
          setError(null);
        })
        .catch(() => {
          setError("Não foi possível processar essa imagem.");
        })
        .finally(() => {
          setLogoUploading(false);
        });
    };
    reader.onerror = () => {
      setError("Não foi possível ler a imagem.");
      setLogoUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    if (!canEdit) {
      setError("Este recurso está disponível apenas no plano Pro.");
      return;
    }

    if (!isHexColor(fontColor) || !isHexColor(backgroundColor) || !isHexColor(gridColor)) {
      setError("As cores precisam estar no formato hexadecimal (#RRGGBB).");
      return;
    }

    const parsedValidity = validityDays.trim() === "" ? 0 : Number(validityDays);
    if (!Number.isFinite(parsedValidity) || parsedValidity < 0 || parsedValidity > 365) {
      setError("Validade deve ser um número entre 0 e 365.");
      return;
    }

    setSaving(true);
    try {
      await updateBudgetProfile(accessToken, {
        companyLogoUrl: companyLogoUrl.trim(),
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        companyCnpj: companyCnpj.trim(),
        validityDays: parsedValidity,
        fontColor: fontColor.trim(),
        backgroundColor: backgroundColor.trim(),
        gridColor: gridColor.trim(),
        templateId: templateId,
      });
      setSuccess("Perfil padrão salvo com sucesso.");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Não foi possível salvar o perfil padrão.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-zinc-100";

  function renderFormCard(): JSX.Element {
    return (
      <Card className="bg-teal-50">
        <form onSubmit={handleSubmit} className="space-y-5">
          {!canEdit && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No plano Free este recurso fica desabilitado.{" "}
              <Link href="/plans" className="font-semibold underline underline-offset-2">
                Assine o plano Pro
              </Link>{" "}
              para salvar o perfil padrão de orçamento.
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Logo da empresa (opcional)</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={!canEdit}
              />
              <Button
                type="button"
                size="sm"
                isLoading={logoUploading}
                onClick={() => fileInputRef.current?.click()}
                disabled={!canEdit}
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
              >
                Buscar do armazenamento
              </Button>
              {companyLogoUrl.startsWith("data:") ? (
                <input
                  type="text"
                  readOnly
                  value={logoFileName}
                  className={`${inputClass} min-w-[220px] flex-1 bg-zinc-50`}
                  placeholder="Nome do arquivo"
                  disabled={!canEdit}
                />
              ) : (
                <>
                  <span className="text-sm text-zinc-500">ou</span>
                  <input
                    type="url"
                    value={companyLogoUrl}
                    onChange={(e) => {
                      setCompanyLogoUrl(e.target.value);
                      setLogoFileName("");
                    }}
                    placeholder="Cole a URL da logo"
                    className={`${inputClass} min-w-[220px] flex-1`}
                    disabled={!canEdit}
                  />
                </>
              )}
            </div>
            {companyLogoUrl && (
              <div className="mt-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogoUrl}
                  alt="Logo da empresa"
                  className="h-12 w-auto rounded border border-zinc-200 object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCompanyLogoUrl("");
                    setLogoFileName("");
                  }}
                  className="text-sm text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-zinc-400"
                  disabled={!canEdit}
                >
                  Remover logo
                </button>
              </div>
            )}
          </div>

          <LogoEditorModal
            isOpen={logoModalOpen}
            onClose={() => {
              setLogoModalOpen(false);
              setLogoPendingDataUrl(null);
            }}
            imageDataUrl={logoPendingDataUrl}
            onConfirm={(resizedDataUrl) => {
              setCompanyLogoUrl(resizedDataUrl);
              setLogoFileName(logoPendingFileName);
              setLogoModalOpen(false);
              setLogoPendingDataUrl(null);
            }}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa"
              className={inputClass}
              disabled={!canEdit}
            />
            <input
              value={companyCnpj}
              onChange={(e) => setCompanyCnpj(formatCnpj(e.target.value))}
              maxLength={18}
              placeholder="CNPJ"
              className={inputClass}
              disabled={!canEdit}
            />
            <input
              value={companyPhone}
              onChange={(e) => setCompanyPhone(formatPhone(e.target.value))}
              maxLength={15}
              placeholder="Telefone da empresa"
              className={inputClass}
              disabled={!canEdit}
            />
            <input
              type="number"
              min={0}
              max={365}
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="Validade padrão (dias)"
              className={inputClass}
              disabled={!canEdit}
            />
          </div>

          <textarea
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            placeholder="Endereço da empresa"
            rows={2}
            className={inputClass}
            disabled={!canEdit}
          />

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={saving}
              disabled={!canEdit}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm"
            >
              Salvar perfil padrão
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <>
      <div className="flex h-screen w-full flex-1 min-h-0 flex-col overflow-hidden lg:hidden">
        <h1 className="mb-2 mt-2 shrink-0 pt-0 text-center text-xl font-bold text-zinc-900 sm:mt-0 sm:text-left">
          Perfil de orçamento
        </h1>

        <div className="mx-2 mb-2 shrink-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex justify-center gap-3">
            <MobileColorDropdown
              label="Fonte"
              value={fontColor}
              onChange={setFontColor}
              colors={fontColors}
              isOpen={openDropdown === "font"}
              onToggle={() => setOpenDropdown(openDropdown === "font" ? null : "font")}
              disabled={!canEdit}
            />
            <MobileColorDropdown
              label={isModernLikeTemplate ? "Fundo" : "Grade"}
              value={gridColor}
              onChange={setGridColor}
              colors={gridColors}
              isOpen={openDropdown === "grid"}
              onToggle={() => setOpenDropdown(openDropdown === "grid" ? null : "grid")}
              disabled={!canEdit}
            />
            <MobileColorDropdown
              label={isModernLikeTemplate ? "Grade" : "Fundo"}
              value={backgroundColor}
              onChange={setBackgroundColor}
              colors={backgroundColors}
              isOpen={openDropdown === "bg"}
              onToggle={() => setOpenDropdown(openDropdown === "bg" ? null : "bg")}
              disabled={!canEdit}
            />
            <MobileTemplateDropdown
              value={effectiveTemplateId}
              onChange={(value) => setTemplateId(value as LayoutId)}
              options={templateOptions}
              isOpen={openDropdown === "template"}
              onToggle={() => setOpenDropdown(openDropdown === "template" ? null : "template")}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="mb-4 flex shrink-0 gap-2 px-4">
          <button
            type="button"
            onClick={() => setActiveView("form")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeView === "form"
                ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm hover:from-teal-700 hover:to-green-800"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Formulário
          </button>
          <button
            type="button"
            onClick={() => setActiveView("preview")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeView === "preview"
                ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm hover:from-teal-700 hover:to-green-800"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Prévia
          </button>
        </div>

        {loading ? (
          <div className="px-4 text-sm text-zinc-600">Carregando perfil padrão...</div>
        ) : (
          <>
            {activeView === "form" && (
              <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                {renderFormCard()}
              </div>
            )}

            {activeView === "preview" && (
              <div className="h-full min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                <BackendTemplatePreview
                  html={backendPreviewHtml}
                  loading={backendPreviewLoading}
                  error={backendPreviewError}
                  title={`Prévia do template ${effectiveTemplateId}`}
                  minHeightClassName="min-h-[420px]"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="hidden h-full min-h-0 w-full flex-1 gap-6 overflow-hidden lg:flex">
        <div className="flex min-h-0 min-w-0 max-w-lg flex-1 flex-col overflow-hidden">
          <h1 className="mb-3 shrink-0 text-center text-lg font-semibold text-zinc-800">
            Perfil de orçamento
          </h1>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-zinc-600">Carregando perfil padrão...</p>
            ) : (
              renderFormCard()
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <h2 className="mb-3 shrink-0 text-center text-lg font-semibold text-zinc-800">
              Prévia (PDF)
            </h2>
            <div className="min-h-0 flex-1 overflow-hidden">
              <BackendTemplatePreview
                html={backendPreviewHtml}
                loading={backendPreviewLoading}
                error={backendPreviewError}
                title={`Prévia do template ${effectiveTemplateId}`}
                minHeightClassName="min-h-[420px]"
              />
            </div>
          </div>

          <div className="flex min-h-0 w-52 shrink-0 flex-col overflow-hidden">
            <h2 className="mb-3 shrink-0 text-center text-lg font-semibold text-zinc-800">
              Layout
            </h2>
            <aside className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
              <ColorPaletteRow
                label="Fonte"
                value={fontColor}
                onChange={setFontColor}
                colors={fontColors}
                disabled={!canEdit}
              />
              <ColorPaletteRow
                label={isModernLikeTemplate ? "Fundo" : "Grade"}
                value={gridColor}
                onChange={setGridColor}
                colors={gridColors}
                disabled={!canEdit}
              />
              <ColorPaletteRow
                label={isModernLikeTemplate ? "Grade" : "Fundo"}
                value={backgroundColor}
                onChange={setBackgroundColor}
                colors={backgroundColors}
                disabled={!canEdit}
              />

              <div className="mt-2 border-t border-zinc-200 pt-3">
                <p className="mb-2 text-center text-sm font-medium text-zinc-700">Template</p>
                <div className="space-y-1 text-sm text-zinc-700">
                  {templateOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="templateId-profile"
                        value={option.value}
                        checked={effectiveTemplateId === option.value}
                        onChange={() => setTemplateId(option.value)}
                        className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                        disabled={!canEdit || option.disabled}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {!canUsePremiumTemplates && (
                  <p className="mt-3 text-xs font-medium text-amber-700">
                    No plano Free, você pode visualizar os templates premium, mas a configuração fica disponível apenas no plano Pro.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
