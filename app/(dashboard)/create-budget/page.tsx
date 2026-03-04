"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createBudget, generatePdf } from "@/services/budgets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BudgetPdfPreview } from "@/components/BudgetPdfPreview";
import { LogoEditorModal } from "@/components/LogoEditorModal";
import type { BudgetItem, CreateBudgetBody } from "@/types/budget";
import type { ApiError } from "@/lib/api";
import {
  type LayoutId,
  type BudgetLayoutConfig,
  fetchBudgetLayout,
} from "@/lib/budgetLayouts";

const EMPTY_ITEM: BudgetItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
};

function ColorPaletteRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colors: string[];
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
            className={`h-8 w-8 shrink-0 rounded-md border-2 shadow-sm transition-transform hover:scale-110 ${
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

const MAX_LOGO_PX = 2048;

/** Redimensiona a imagem se algum lado passar de MAX_LOGO_PX, para não travar. */
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
      const r = Math.min(MAX_LOGO_PX / w, MAX_LOGO_PX / h);
      const cw = Math.round(w * r);
      const ch = Math.round(h * r);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = dataUrl;
  });
}

/** Formata CNPJ: 00.000.000/0000-00 (apenas dígitos, máx. 14). */
function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/** Formata telefone: (00) 00000-0000 ou (00) 0000-0000. */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CreateBudgetPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [validityDays, setValidityDays] = useState<number>(15);
  const [observation, setObservation] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [logoPendingDataUrl, setLogoPendingDataUrl] = useState<string | null>(null);
  const [logoPendingFileName, setLogoPendingFileName] = useState("");
  const [previewFontColor, setPreviewFontColor] = useState("#18181b");
  const [previewBgColor, setPreviewBgColor] = useState("#ffffff");
  const [previewGridColor, setPreviewGridColor] = useState("#20b2aa");
  const [templateId, setTemplateId] = useState<LayoutId>("simples");
  const [layout, setLayout] = useState<BudgetLayoutConfig | null>(null);
  const totalCalculado = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Carrega o layout do orçamento sempre que o template selecionado mudar
  useEffect(() => {
    let cancelled = false;
    fetchBudgetLayout(templateId)
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch(() => {
        if (!cancelled) setLayout(null);
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof BudgetItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }
    const type = (file.type || "").toLowerCase();
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(type)) {
      setError("Use uma imagem (JPEG, PNG, GIF ou WebP).");
      return;
    }
    setError(null);
    e.target.value = "";
    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!dataUrl.startsWith("data:")) {
        setLogoUploading(false);
        return;
      }
      resizeLogoIfNeeded(dataUrl)
        .then((url) => {
          setLogoPendingDataUrl(url);
          setLogoPendingFileName(file.name);
          setLogoModalOpen(true);
        })
        .catch(() => setError("Não foi possível processar a imagem. Tente outra."))
        .finally(() => setLogoUploading(false));
    };
    reader.onerror = () => {
      setError("Erro ao ler o arquivo.");
      setLogoUploading(false);
    };
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Não foi possível ler o arquivo. Tente outra imagem.");
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Título é obrigatório.");
      return;
    }

    const validItems = items.filter(
      (i) =>
        i.description.trim() !== "" &&
        i.quantity > 0 &&
        i.unitPrice >= 0
    );
    if (validItems.length === 0) {
      setError("Adicione pelo menos um item com descrição, quantidade > 0 e preço unitário >= 0.");
      return;
    }

    if (totalCalculado <= 0) {
      setError("O total deve ser maior que zero.");
      return;
    }

    const logo = companyLogoUrl.trim();
    if (logo && !logo.startsWith("data:") && !isValidUrl(logo)) {
      setError("URL da logo inválida ou use um arquivo local.");
      return;
    }

    if (!clientName.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }

    if (clientEmail.trim() && !isValidEmail(clientEmail.trim())) {
      setError("E-mail do cliente inválido.");
      return;
    }

    if (!accessToken) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    const body: CreateBudgetBody = {
      title: title.trim(),
      description: description.trim() || undefined,
      value: totalCalculado,
      companyLogoUrl: companyLogoUrl.trim() || undefined,
      companyName: companyName.trim() || undefined,
      companyAddress: companyAddress.trim() || undefined,
      companyPhone: companyPhone.trim() || undefined,
      companyCnpj: companyCnpj.trim() || undefined,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      clientAddress: clientAddress.trim() || undefined,
      documentDate: documentDate || undefined,
      validityDays: validityDays > 0 ? validityDays : undefined,
      observation: observation.trim() || undefined,
      items: validItems.length > 0 ? validItems : undefined,
      fontColor: previewFontColor?.trim() || undefined,
      backgroundColor: previewBgColor?.trim() || undefined,
      gridColor: previewGridColor?.trim() || undefined,
      templateId: templateId || undefined,
    };

    setLoading(true);
    try {
      const budget = await createBudget(body, accessToken);
      try {
        await generatePdf(budget.id, accessToken);
      } catch (_) {
        // PDF será gerado depois na tela do orçamento se falhar
      }
      router.push(`/dashboard/budget/${budget.id}`);
      router.refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Erro ao criar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1";

  return (
    <div className="flex min-h-0 flex-1 w-full gap-6 overflow-hidden">
      {/* Coluna esquerda: título fixo + barra de rolagem apenas nos campos */}
      <div className="flex min-h-0 min-w-0 max-w-lg flex-1 flex-col overflow-hidden">
        <h1 className="mb-3 shrink-0 text-center text-lg font-semibold text-zinc-800">
          Informações do orçamento
        </h1>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <Card className="shrink-0">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              rows={2}
              className={inputBase}
              placeholder="Detalhes do serviço ou escopo"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Logo da empresa (opcional)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={logoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Buscar do armazenamento
              </Button>
              <span className="text-sm text-zinc-500">ou</span>
              {companyLogoUrl.startsWith("data:") ? (
                <input
                  type="text"
                  readOnly
                  value={logoFileName}
                  className={`${inputBase} min-w-[200px] flex-1 bg-zinc-50`}
                  placeholder="Nome do arquivo"
                />
              ) : (
                <input
                  type="url"
                  value={companyLogoUrl}
                  onChange={(e) => {
                    setCompanyLogoUrl(e.target.value);
                    setLogoFileName("");
                  }}
                  className={`${inputBase} min-w-[200px] flex-1`}
                  placeholder="Colar URL da logo"
                />
              )}
            </div>
            {companyLogoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={companyLogoUrl}
                  alt="Logo"
                  className="h-12 w-auto rounded border border-zinc-200 object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCompanyLogoUrl("");
                    setLogoFileName("");
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
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

          <Input
            label="Nome da empresa"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Sua empresa"
          />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-800">
              Dados do cliente
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Data
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className={inputBase}
                />
              </div>
              <Input
                label="Nome"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
                required
              />
              <Input
                label="E-mail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
              <Input
                label="Telefone"
                value={clientPhone}
                onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
              <Input
                label="Endereço do cliente"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Endereço completo do cliente"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-800">
              Dados do serviço
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="pb-2 text-left text-sm font-medium text-zinc-700">
                      Descrição
                    </th>
                    <th className="w-20 pb-2 text-left text-sm font-medium text-zinc-700">
                      Qtd
                    </th>
                    <th className="w-28 pb-2 text-left text-sm font-medium text-zinc-700">
                      Valor un.
                    </th>
                    <th className="w-24 pb-2 text-right text-sm font-medium text-zinc-700">
                      Subtotal
                    </th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="py-2">
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(i, "description", e.target.value)
                          }
                          className={`${inputBase} py-2`}
                          placeholder="Descrição do item"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "quantity",
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className={`${inputBase} py-2`}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(
                              i,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`${inputBase} py-2`}
                        />
                      </td>
                      <td className="py-2 text-right text-sm text-zinc-600">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              + Adicionar mais itens
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[120px]">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Validade (dias)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={validityDays}
                onChange={(e) =>
                  setValidityDays(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className={inputBase}
                placeholder="Ex: 7"
              />
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-700">
                Total:{" "}
              </span>
              <span className="text-lg font-semibold text-zinc-900">
                {formatCurrency(totalCalculado)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Observação (opcional)
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              className={inputBase}
              placeholder="Observações adicionais"
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-800">
              Dados da empresa
            </h3>
            <div className="space-y-3">
              <Input
                label="Endereço"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Endereço completo"
              />
              <Input
                label="Telefone"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
              <Input
                label="CNPJ"
                value={companyCnpj}
                onChange={(e) => setCompanyCnpj(formatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
              />
            </div>
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
      </div>

      {/* Coluna direita: prévia do PDF (esquerda) + painel de cores (direita) */}
      <div className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <h2 className="mb-3 shrink-0 text-center text-lg font-semibold text-zinc-800">
            Prévia (formato do PDF)
          </h2>
          <div className="min-h-0 flex-1 overflow-hidden">
            {layout && (
              <BudgetPdfPreview
                companyLogoUrl={companyLogoUrl}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                companyCnpj={companyCnpj}
                documentDate={documentDate}
                clientName={clientName}
                clientPhone={clientPhone}
                clientEmail={clientEmail}
                clientAddress={clientAddress}
                title={title}
                items={items}
                total={totalCalculado}
                validityDays={validityDays}
                observation={observation}
                fontColor={previewFontColor}
                backgroundColor={previewBgColor}
                gridColor={previewGridColor}
                templateId={templateId}
                layout={layout}
              />
            )}
          </div>
        </div>
        <div className="flex min-h-0 w-52 shrink-0 flex-col overflow-hidden">
          <h2 className="mb-3 shrink-0 text-center text-lg font-semibold text-zinc-800">
            Layout
          </h2>
          <aside className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
            <ColorPaletteRow
              label="Fonte"
              value={previewFontColor}
              onChange={setPreviewFontColor}
              colors={[
                "#3b82f6",
                "#20b2aa",
                "#ef4444",
                "#f59e0b",
                "#6b7280",
                "#8b5cf6",
                "#000000",
                "#ffffff",
              ]}
            />
            <ColorPaletteRow
              label={templateId === "moderno" ? "Fundo" : "Grade"}
              value={previewGridColor}
              onChange={setPreviewGridColor}
              colors={[
                "#3b82f6",
                "#20b2aa",
                "#ef4444",
                "#f59e0b",
                "#6b7280",
                "#8b5cf6",
                "#000000",
                "#ffffff",
              ]}
            />
            <ColorPaletteRow
              label={templateId === "moderno" ? "Grade" : "Fundo"}
              value={previewBgColor}
              onChange={setPreviewBgColor}
              colors={[
                "#dbeafe",
                "#e0f7fa",
                "#fee2e2",
                "#fef9c3",
                "#f3f4f6",
                "#ede9fe",
                "#e5e5e5",
                "#ffffff",
              ]}
            />

            <div className="mt-2 border-t border-zinc-200 pt-3">
              <p className="mb-2 text-center text-sm font-medium text-zinc-700">
                Template
              </p>
              <div className="space-y-1 text-sm text-zinc-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="templateId"
                    value="simples"
                    checked={templateId === "simples"}
                    onChange={() => setTemplateId("simples")}
                    className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Simples</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="templateId"
                    value="moderno"
                    checked={templateId === "moderno"}
                    onChange={() => setTemplateId("moderno")}
                    className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Moderno</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="templateId"
                    value="profissional"
                    checked={templateId === "profissional"}
                    onChange={() => setTemplateId("profissional")}
                    className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Profissional</span>
                </label>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
