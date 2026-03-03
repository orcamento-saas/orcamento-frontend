"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import type { BudgetItem } from "@/types/budget";
import type { BudgetLayoutConfig } from "@/lib/budgetLayouts";

/** A4 em pixels (96 DPI): 210mm × 297mm */
const A4_WIDTH_PX = 210 * (96 / 25.4);
const A4_HEIGHT_PX = 297 * (96 / 25.4);

interface BudgetPdfPreviewProps {
  companyLogoUrl: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyCnpj: string;
  documentDate: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  title: string;
  items: BudgetItem[];
  total: number;
  validityDays: number;
  observation: string;
  /** Cor do texto (fonte) */
  fontColor?: string;
  /** Cor de fundo da página */
  backgroundColor?: string;
  /** Cor das bordas/grade (tabela, caixas) */
  gridColor?: string;
  /** Escala mínima (ex.: 1.25 = 125%) para exibir maior e com barra de rolagem */
  minScale?: number;
  /** Exibir lupa ao passar o mouse (default: true) */
  showLens?: boolean;
  /** ID do template/layout (simples, moderno, profissional) - apenas informativo */
  templateId?: string | null;
  /** Configuração completa do layout, vinda do backend */
  layout: BudgetLayoutConfig;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata YYYY-MM-DD como DD/MM/YYYY em horário local (evita dia errado por timezone). */
function formatDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Prévia fiel ao layout do PDF:
 * - Logo topo esquerda, nome empresa centralizado/maior
 * - Bloco com borda preta: esquerda (Data, Telefone, Cliente) | direita (ORÇAMENTO)
 * - Tabela com grade e bordas em todas as células
 * - Válido por 15 dias (esq) | TOTAL GERAL em caixa arredondada (dir)
 * - Caixas arredondadas: Assinatura e Observação
 * - Rodapé: Endereço; Telefone - Email
 */
export function BudgetPdfPreview({
  companyLogoUrl,
  companyName,
  companyAddress,
  companyPhone,
  companyCnpj,
  documentDate,
  clientName,
  clientPhone,
  clientEmail,
  clientAddress,
  title,
  items,
  total,
  validityDays,
  observation,
  fontColor = "#18181b",
  backgroundColor = "#ffffff",
  gridColor = "#000000",
  minScale: minScaleProp,
  showLens = true,
  templateId: _templateId,
  layout,
}: BudgetPdfPreviewProps) {
  const isModern = layout.id === "moderno";
  const validItems = items.filter(
    (i) => i.description.trim() !== "" && i.quantity > 0 && i.unitPrice >= 0
  );
  const dataExibida = documentDate?.trim()
    ? formatDate(documentDate.trim())
    : "";
  const emptyRows = Math.max(0, layout.minItemRows - validItems.length);
  const logoUrl = companyLogoUrl?.trim() || "";
  const [logoError, setLogoError] = useState(false);
  const [scale, setScale] = useState(1);
  const [lens, setLens] = useState<{
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => setLogoError(false), [logoUrl]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!showLens) return;
    const container = containerRef.current;
    const wrapper = contentWrapperRef.current;
    if (!container || !wrapper) return;
    const cr = container.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();
    const x = e.clientX - cr.left;
    const y = e.clientY - cr.top;
    const originX = (e.clientX - wr.left) / scale;
    const originY = (e.clientY - wr.top) / scale;
    setLens({ x, y, originX, originY });
  };

  const handleMouseLeave = () => setLens(null);

  const LENS_R = 80;
  const LENS_ZOOM = 2;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateScale = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      let s = Math.min(w / A4_WIDTH_PX, h / A4_HEIGHT_PX, 1);
      if (minScaleProp != null && minScaleProp > 0) {
        s = Math.max(s, minScaleProp);
      }
      setScale(s);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minScaleProp]);

  const borderStyle = { borderColor: gridColor };
  const baseBodyStyle = {
    color: fontColor,
    fontSize: layout.bodyFontSize,
    lineHeight: layout.bodyLineHeight,
    fontFamily: layout.fontFamily,
  };

  const previewBodyContent = (
    <div className="flex flex-col" style={baseBodyStyle}>
      {/* 1. Header: nome da empresa centralizado na página + logo à direita */}
      <div className="flex w-full items-center" style={{ marginBottom: layout.headerMarginBottom }}>
        <div style={{ width: layout.logoWidth, height: layout.logoHeight, flexShrink: 0 }} aria-hidden />
        <div className="flex flex-1 justify-center">
          <p className="text-center font-bold" style={{ fontSize: layout.headerCenterFontSize }}>
            {companyName?.trim() || "Nome da empresa"}
          </p>
        </div>
        {logoUrl ? (
          <div
            className="shrink-0 overflow-hidden"
            style={{ width: layout.logoWidth, height: layout.logoHeight, borderRadius: layout.logoBorderRadius }}
          >
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                Logo
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex shrink-0 items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 text-center text-xs italic text-zinc-400"
            style={{ width: layout.logoWidth, height: layout.logoHeight, borderRadius: layout.logoBorderRadius }}
          >
            Logo da empresa
          </div>
        )}
      </div>

      {/* 2. Bloco principal: duas colunas separadas por linha vertical */}
      <div className="border" style={{ ...borderStyle, borderRadius: layout.infoBlockBorderRadius, overflow: "hidden" }}>
        <div className="flex">
          <div
            className="min-w-0 flex-1 border-r"
            style={{ ...borderStyle, backgroundColor, padding: layout.infoBlockPadding, fontSize: layout.infoLeftFontSize }}
          >
            <p>Cliente: {clientName?.trim() || "Nome do cliente"}</p>
            <p>Telefone: {clientPhone?.trim() || "Telefone do cliente"}</p>
            <p>E-mail: {clientEmail?.trim() || "E-mail do cliente"}</p>
            <p>Endereço: {clientAddress?.trim() || "Endereço do cliente"}</p>
          </div>
          <div
            className="flex w-40 shrink-0 flex-col items-center justify-center"
            style={{ backgroundColor, padding: layout.infoBlockPadding }}
          >
            <p className="text-center font-bold uppercase" style={{ fontSize: layout.infoRightTitFontSize }}>
              ORÇAMENTO
            </p>
            <p className="text-center opacity-90" style={{ fontSize: layout.infoRightDateFontSize, marginTop: layout.infoRightDateMarginTop }}>
              {dataExibida || "Data do documento"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tabela com grade */}
      <table
        className="w-full border-collapse"
        style={{
          marginTop: layout.tableMarginTop,
          ...(layout.tableBorder ? { ...borderStyle, borderWidth: 1, borderStyle: "solid" as const } : {}),
        }}
      >
        <thead>
          <tr>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize }}>QUANT.</th>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize }}>DESCRIÇÃO DO ITEM</th>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize }}>VALOR UN.</th>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize }}>VALOR TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {validItems.map((item, i) => (
            <tr key={i}>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize }}>{item.quantity}</td>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize }}>{item.description}</td>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize }}>{formatCurrency(item.unitPrice)}</td>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border" style={{ ...borderStyle, padding: layout.tableCellPadding }}>&nbsp;</td>
              <td className="border" style={{ ...borderStyle, padding: layout.tableCellPadding }}>&nbsp;</td>
              <td className="border" style={{ ...borderStyle, padding: layout.tableCellPadding }}>&nbsp;</td>
              <td className="border" style={{ ...borderStyle, padding: layout.tableCellPadding }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Válido por X dias (esq) | TOTAL GERAL + valor em caixa arredondada (dir) */}
      <div className="flex items-center justify-between" style={{ marginTop: layout.summaryMarginTop, gap: layout.totalWrapGap }}>
        <span style={{ fontSize: layout.validityFontSize }}>
          {validityDays > 0 ? `Válido por ${validityDays} dias` : "Válido por 15 dias"}
        </span>
        <div className="flex items-center gap-2" style={{ gap: layout.totalWrapGap }}>
          <span className="font-bold" style={{ fontSize: layout.totalLabelFontSize }}>TOTAL GERAL</span>
          <span
            className="border font-bold"
            style={{ ...borderStyle, backgroundColor, padding: layout.totalValuePadding, borderRadius: layout.totalValueBorderRadius, fontSize: layout.totalValueFontSize }}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* 5. Caixa Assinatura */}
      <div
        className="border"
        style={{ ...borderStyle, backgroundColor, padding: layout.boxPadding, borderRadius: layout.boxBorderRadius, marginTop: layout.boxMarginTop }}
      >
        <p className="font-medium" style={{ marginBottom: layout.boxLabelMarginBottom }}>Assinatura:</p>
        <div className="border-b border-zinc-300" style={{ minHeight: layout.signatureLineMinHeight }} />
      </div>

      {/* 6. Caixa Observação */}
      <div
        className="border"
        style={{ ...borderStyle, padding: layout.boxPadding, borderRadius: layout.boxBorderRadius, marginTop: layout.boxMarginTop, minHeight: layout.boxObservationMinHeight }}
      >
        <p className="font-medium" style={{ marginBottom: layout.boxLabelMarginBottom }}>Observação:</p>
        {observation ? (
          <p className="opacity-90" style={{ fontSize: layout.boxObservationContentFontSize }}>{observation}</p>
        ) : (
          <div className="mt-1 h-16" />
        )}
      </div>
    </div>
  );

  const previewFooter = (
    <div
      className="text-center opacity-80"
      style={{
        flexShrink: 0,
        paddingTop: layout.footerPaddingTop,
        fontSize: layout.footerFontSize,
      }}
    >
      <p>Endereço: {companyAddress?.trim() || "Endereço da empresa"}</p>
      <p style={{ marginTop: layout.footerLineGap }}>Telefone: {companyPhone?.trim() || "Telefone da empresa"} - Email: {clientEmail?.trim() || "E-mail do cliente"}</p>
      <p style={{ marginTop: layout.footerLineGap }}>CNPJ: {companyCnpj?.trim() || "CNPJ da empresa"}</p>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`pdf-preview-viewport relative flex h-full min-h-0 w-full max-w-full justify-center ${minScaleProp != null && minScaleProp > 0 ? "overflow-auto" : "overflow-hidden"}`}
    >
      <div
        ref={contentWrapperRef}
        className="shrink-0 print:!scale-100"
        style={{
          width: A4_WIDTH_PX * scale,
          height: A4_HEIGHT_PX * scale,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="pdf-preview-content flex flex-col rounded-xl border shadow-sm print:shadow-none"
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            padding: layout.bodyPadding,
            boxSizing: "border-box",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundColor: "#ffffff",
            color: fontColor,
            borderColor: gridColor,
          }}
        >
          {isModern && (
            <div
              style={{
                width: "100%",
                height: 10,
                backgroundColor: gridColor,
                marginBottom: 12,
              }}
            />
          )}

          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {previewBodyContent}
          </div>

          {isModern && (
            <div
              style={{
                width: "100%",
                height: 3,
                backgroundColor: gridColor,
                marginTop: 12,
              }}
            />
          )}

          {previewFooter}
        </div>
      </div>

      {showLens && lens && (
        <div
          className="pointer-events-none absolute z-10 overflow-hidden rounded-full border-2 border-zinc-300 bg-white shadow-lg print:hidden"
          style={{
            left: lens.x - LENS_R,
            top: lens.y - LENS_R,
            width: LENS_R * 2,
            height: LENS_R * 2,
          }}
          aria-hidden
        >
          <div
            className="pdf-preview-content flex flex-col border"
            style={{
              position: "absolute",
              width: A4_WIDTH_PX,
              height: A4_HEIGHT_PX,
              padding: layout.bodyPadding,
              boxSizing: "border-box",
              transform: `scale(${scale * LENS_ZOOM})`,
              transformOrigin: "top left",
              left: LENS_R - lens.originX * scale * LENS_ZOOM,
              top: LENS_R - lens.originY * scale * LENS_ZOOM,
              backgroundColor: "#ffffff",
              color: fontColor,
              borderColor: gridColor,
            }}
          >
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              {previewBodyContent}
            </div>
            {previewFooter}
          </div>
        </div>
      )}
    </div>
  );
}
