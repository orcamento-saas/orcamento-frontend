import type { BudgetLayoutConfig, LayoutId } from "@/lib/budgetLayouts";

/** Largura útil da página A4 no HTML do PDF (px). */
export const A4_PAGE_WIDTH_PX = 794;

/** Fallback: largura do conteúdo (754px) menos a caixa ORÇAMENTO (220px). */
export const CLIENT_LINE_MAX_WIDTH_FALLBACK: Record<LayoutId, number> = {
  simples: 534,
  moderno: 534,
  profissional: 540,
};

export const CLIENT_INFO_FONT_SIZE_FALLBACK: Record<LayoutId, number> = {
  simples: 16,
  moderno: 16,
  profissional: 17,
};

export type ClientPdfLineField =
  | "clientName"
  | "clientPhone"
  | "clientEmail"
  | "clientAddress";

/** Rótulos exatamente como no PDF: <strong>Cliente:</strong> valor */
const CLIENT_LINE_LABELS: Record<ClientPdfLineField, string> = {
  clientName: "Cliente:",
  clientPhone: "Telefone:",
  clientEmail: "E-mail:",
  clientAddress: "Endereço:",
};

let measureCanvas: HTMLCanvasElement | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  measureCanvas ??= document.createElement("canvas");
  return measureCanvas.getContext("2d");
}

/** Largura da linha completa (rótulo em negrito + valor), como no PDF. */
export function measureClientPdfLineWidth(
  field: ClientPdfLineField,
  value: string,
  fontSizePx: number
): number {
  const ctx = getMeasureContext();
  if (!ctx) return 0;

  const label = CLIENT_LINE_LABELS[field];
  const labelFont = `700 ${fontSizePx}px Inter, system-ui, sans-serif`;
  const valueFont = `400 ${fontSizePx}px Inter, system-ui, sans-serif`;

  ctx.font = labelFont;
  const labelWidth = ctx.measureText(`${label} `).width;
  ctx.font = valueFont;
  const valueWidth = ctx.measureText(value).width;

  return labelWidth + valueWidth;
}

export function getClientLineMaxWidthPx(
  templateId: LayoutId,
  layout?: Pick<BudgetLayoutConfig, "clientInfoLineMaxWidthPx"> | null
): number {
  return (
    layout?.clientInfoLineMaxWidthPx ??
    CLIENT_LINE_MAX_WIDTH_FALLBACK[templateId]
  );
}

export function getClientInfoFontSizePx(
  templateId: LayoutId,
  layout?: Pick<BudgetLayoutConfig, "clientInfoFontSizePx"> | null
): number {
  return layout?.clientInfoFontSizePx ?? CLIENT_INFO_FONT_SIZE_FALLBACK[templateId];
}

/**
 * Impede texto além da “linha vermelha” (largura do bloco cliente no PDF).
 * Não usa contagem de caracteres — mede pixels com a fonte Inter do documento.
 */
export function clampClientFieldToPdfLine(
  field: ClientPdfLineField,
  nextValue: string,
  templateId: LayoutId,
  layout?: Pick<
    BudgetLayoutConfig,
    "clientInfoLineMaxWidthPx" | "clientInfoFontSizePx"
  > | null
): string {
  const sanitized = nextValue.replace(/[\r\n]/g, " ");
  const maxWidth = getClientLineMaxWidthPx(templateId, layout);
  const fontSize = getClientInfoFontSizePx(templateId, layout);

  if (measureClientPdfLineWidth(field, sanitized, fontSize) <= maxWidth) {
    return sanitized;
  }

  let trimmed = sanitized;
  while (trimmed.length > 0) {
    trimmed = trimmed.slice(0, -1);
    if (measureClientPdfLineWidth(field, trimmed, fontSize) <= maxWidth) {
      return trimmed;
    }
  }
  return "";
}

export async function ensureInterFontForPdfMeasure(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const sizes = [16, 17];
  await Promise.all(
    sizes.flatMap((size) => [
      document.fonts.load(`400 ${size}px Inter`),
      document.fonts.load(`700 ${size}px Inter`),
    ])
  ).catch(() => undefined);
}
