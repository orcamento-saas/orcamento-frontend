"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import type { BudgetItem } from "@/types/budget";
import type { BudgetLayoutConfig } from "@/lib/budgetLayouts";

/** A4 em pixels (96 DPI): 210mm × 297mm */
const A4_WIDTH_PX = 210 * (96 / 25.4);
const A4_HEIGHT_PX = 297 * (96 / 25.4);

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function createGradientFromBaseColor(baseColor: string): string {
  const hsl = hexToHsl(baseColor);
  const color1 = hslToHex(hsl.h, Math.min(hsl.s, 80), Math.min(hsl.l + 5, 85));
  const color2 = hslToHex(hsl.h, Math.min(hsl.s + 10, 90), Math.max(hsl.l - 10, 15));
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

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
  /** ID do template/layout (simples, moderno) - apenas informativo */
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
  gridColor = "#20b2aa",
  minScale: minScaleProp,
  showLens = true,
  templateId: _templateId,
  layout,
}: BudgetPdfPreviewProps) {
  const isModern = layout?.id === "moderno";
  
  // Função para detectar cor clara
  const isLightColor = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    return l > 0.7;
  };
  
  // Para template moderno: ajusta cores dos itens quando background for claro
  const isLightBg = isModern && isLightColor(backgroundColor);
  const itemBgEven = isLightBg ? backgroundColor : '#f8f9fa';
  
  // Gera gradient baseado na cor de fundo para áreas coloridas
  const themeGradient = createGradientFromBaseColor(gridColor);
  
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

  // Template Moderno - estrutura igual à imagem
  const modernBodyContent = (
    <div className="relative h-full" style={baseBodyStyle}>
      {/* Faixa no topo com nome da empresa */}
      <div className="relative mb-8" style={{ height: 80 }}>
        <div 
          className="absolute top-0 left-0 flex items-center pl-8"
          style={{
            width: '100%',
            height: '80px',
            background: themeGradient,
            clipPath: 'polygon(0 0, 85% 0, 75% 100%, 0 100%)',
            zIndex: 1,
          }}
        >
          <div
            className="font-bold uppercase text-white"
            style={{
              fontSize: 26,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              color: 'white',
            }}
          >
            {companyName?.trim() || "NOME DA EMPRESA"}
          </div>
        </div>
        
        {/* Logo fora da faixa à direita */}
        <div className="absolute" style={{ top: 15, right: 20, zIndex: 2 }}>
          {logoUrl ? (
            <div
              className="shrink-0 overflow-hidden"
              style={{ 
                width: layout.logoWidth, 
                height: layout.logoHeight,
                borderRadius: layout.logoBorderRadius
              }}
            >
              {!logoError ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  style={{ borderRadius: layout.logoBorderRadius }}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div 
                  className="flex h-full w-full items-center justify-center text-xs border border-dashed border-gray-400 text-gray-600"
                  style={{ 
                    borderRadius: layout.logoBorderRadius
                  }}
                >
                  Logo
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex shrink-0 items-center justify-center border-dashed text-center text-xs border-gray-400 text-gray-600"
              style={{ 
                width: layout.logoWidth, 
                height: layout.logoHeight,
                border: '1px dashed #ccc',
                borderRadius: layout.logoBorderRadius
              }}
            >
              Logo da empresa
            </div>
          )}
        </div>
      </div>

      {/* Layout de conteúdo: dados do cliente + orçamento */}
      <div className="px-5 mb-4 flex justify-between">
        <div className="flex-1 max-w-[60%]">
          <p className="mb-2" style={{ fontSize: 16, lineHeight: 1.4 }}>
            <strong>Cliente:</strong> {clientName?.trim() || "Nome do cliente"}
          </p>
          <p className="mb-2" style={{ fontSize: 16, lineHeight: 1.4 }}>
            <strong>Telefone:</strong> {clientPhone?.trim() || "Telefone do cliente"}
          </p>
          <p className="mb-2" style={{ fontSize: 16, lineHeight: 1.4 }}>
            <strong>E-mail:</strong> {clientEmail?.trim() || "E-mail do cliente"}
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.4 }}>
            <strong>Endereço:</strong> {clientAddress?.trim() || "Endereço do cliente"}
          </p>
        </div>
        
        <div 
          className="text-center px-5 py-5 bg-white border border-gray-200 shadow-lg"
          style={{ 
            width: 220,
            borderRadius: 8,
          }}
        >
          <div
            className="font-bold uppercase mb-3"
            style={{
              fontSize: 20,
              color: gridColor,
            }}
          >
            ORÇAMENTO
          </div>
          <div style={{ fontSize: 16, color: fontColor, marginBottom: 16 }}>
            {dataExibida || "Data do documento"}
          </div>
        </div>
      </div>

      {/* Container principal do conteúdo */}
      <div className="px-5 flex-1 flex flex-col" style={{ paddingBottom: 100, minHeight: 'calc(100vh - 200px)' }}>
        {/* Tabela de itens */}
        <div 
          className="w-full mb-8 overflow-hidden"
          style={{
            borderRadius: 10,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th
                  className="text-center font-bold uppercase px-4 py-4 text-white"
                  style={{
                    fontSize: 13,
                    background: themeGradient,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    width: '12%'
                  }}
                >
                  QUANT.
                </th>
                <th
                  className="text-center font-bold uppercase px-4 py-4 text-white"
                  style={{
                    fontSize: 13,
                    background: themeGradient,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    width: '46%'
                  }}
                >
                  DESCRIÇÃO DO ITEM
                </th>
                <th
                  className="text-center font-bold uppercase px-4 py-4 text-white"
                  style={{
                    fontSize: 13,
                    background: themeGradient,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    width: '21%'
                  }}
                >
                  VALOR UN.
                </th>
                <th
                  className="text-center font-bold uppercase px-4 py-4 text-white"
                  style={{
                    fontSize: 13,
                    background: themeGradient,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    width: '21%'
                  }}
                >
                  VALOR TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {validItems.map((item, i) => (
                <tr 
                  key={i}
                  className="hover:bg-green-50 transition-colors duration-300"
                  style={{
                    backgroundColor: i % 2 === 0 ? 'white' : itemBgEven,
                  }}
                >
                  <td className="text-center px-4 py-4" style={{ fontSize: 14 }}>
                    {item.quantity}
                  </td>
                  <td className="text-left px-4 py-4 truncate overflow-hidden whitespace-nowrap" style={{ fontSize: 14, maxWidth: 0 }}>
                    {item.description}
                  </td>
                  <td className="text-center px-4 py-4" style={{ fontSize: 14 }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="text-center px-4 py-4" style={{ fontSize: 14 }}>
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <tr 
                  key={`empty-${i}`}
                  style={{
                    backgroundColor: (validItems.length + i) % 2 === 0 ? 'white' : itemBgEven,
                  }}
                >
                  <td className="px-4 py-4">&nbsp;</td>
                  <td className="px-4 py-4">&nbsp;</td>
                  <td className="px-4 py-4">&nbsp;</td>
                  <td className="px-4 py-4">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Validade e Total */}
        <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
          <span style={{ fontSize: 14, color: fontColor }}>
            {validityDays > 0 ? `Válido por ${validityDays} dias` : "Válido por 15 dias"}
          </span>
          <div className="flex items-center gap-4">
            <span className="font-bold" style={{ fontSize: 16 }}>TOTAL GERAL</span>
            <span
              className="font-bold text-white px-5 py-3"
              style={{
                fontSize: 18,
                background: themeGradient,
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(32, 178, 170, 0.3)',
              }}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Observação e Assinatura lado a lado */}
        <div className="flex gap-4" style={{ margin: '10px 0 0 0', minHeight: 160, flex: 1 }}>
          <div
            className="flex-1 px-3 py-3 flex flex-col overflow-hidden"
            style={{
              border: '1px solid #e9ecef',
              borderRadius: 10,
              background: isModern ? backgroundColor : '#f8f9fa',
              minHeight: 160,
              height: '100%',
            }}
          >
            <p 
              className="font-bold mb-2" 
              style={{ 
                fontSize: 16,
                color: gridColor
              }}
            >
              Observação:
            </p>
            {observation ? (
              <p style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.6, flex: 1, overflow: "hidden", wordWrap: "break-word", maxHeight: "96px", overflowY: "hidden" }}>
                {observation}
              </p>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          <div 
            className="text-center px-3 py-3 flex flex-col overflow-hidden"
            style={{ 
              width: 280,
              background: isModern ? backgroundColor : '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 10,
              minHeight: 160,
              height: '100%',
            }}
          >
            <p className="font-bold mb-2" style={{ fontSize: 16, color: gridColor }}>
              Assinatura:
            </p>
            <div
              style={{
                borderBottom: isModern ? `2px solid ${backgroundColor}` : '2px solid #20b2aa',
                minHeight: 60,
                marginBottom: 5,
                marginTop: 'auto',
              }}
            />
          </div>
        </div>

        {/* Rodapé com fundo curvo e dados da empresa */}
        <div 
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
          style={{
            width: '100%',
            height: 100,
            background: themeGradient,
            clipPath: 'polygon(0 30%, 100% 30%, 100% 100%, 0 100%)',
            borderRadius: '15px',
          }}
        >
          <div className="text-center text-white" style={{ fontSize: 11, marginTop: 25 }}>
            <p style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)', margin: '3px 0' }}>Endereço: {companyAddress?.trim() || "Endereço da empresa"}</p>
            <p style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)', margin: '3px 0' }}>Telefone: {companyPhone?.trim() || "Telefone da empresa"}</p>
            <p style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)', margin: '3px 0' }}>CNPJ: {companyCnpj?.trim() || "CNPJ da empresa"}</p>
          </div>
        </div>

      </div>
    </div>
  );

  // Template Simples (original)
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
            style={{ ...borderStyle, backgroundColor, padding: layout.infoBlockPadding, fontSize: layout.infoLeftFontSize, color: fontColor }}
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
          tableLayout: 'fixed',
          ...(layout.tableBorder ? { ...borderStyle, borderWidth: 1, borderStyle: "solid" as const } : {}),
        }}
      >
        <thead>
          <tr>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize, color: fontColor, width: '12%' }}>QUANT.</th>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize, color: fontColor, width: '46%' }}>DESCRIÇÃO DO ITEM</th>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize, color: fontColor, width: '21%' }}>VALOR UN.</th>
            <th className="border text-center font-bold uppercase" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableThFontSize, color: fontColor, width: '21%' }}>VALOR TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {validItems.map((item, i) => (
            <tr key={i}>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize, color: fontColor }}>{item.quantity}</td>
              <td className="border text-left truncate overflow-hidden whitespace-nowrap" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize, color: fontColor, maxWidth: 0 }}>{item.description}</td>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize, color: fontColor }}>{formatCurrency(item.unitPrice)}</td>
              <td className="border text-center" style={{ ...borderStyle, padding: layout.tableCellPadding, fontSize: layout.tableCellFontSize, color: fontColor }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
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
        <span style={{ fontSize: layout.validityFontSize, color: fontColor }}>
          {validityDays > 0 ? `Válido por ${validityDays} dias` : "Válido por 15 dias"}
        </span>
        <div className="flex items-center gap-2" style={{ gap: layout.totalWrapGap }}>
          <span className="font-bold" style={{ fontSize: layout.totalLabelFontSize, color: fontColor }}>TOTAL GERAL</span>
          <span
            className="border font-bold"
            style={{ ...borderStyle, backgroundColor, padding: layout.totalValuePadding, borderRadius: layout.totalValueBorderRadius, fontSize: layout.totalValueFontSize, color: fontColor }}
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
        <p className="font-medium" style={{ marginBottom: layout.boxLabelMarginBottom, color: fontColor }}>Assinatura:</p>
        <div className="border-b border-zinc-300 mt-auto" style={{ minHeight: layout.signatureLineMinHeight }} />
      </div>

      {/* 6. Caixa Observação */}
      <div
        className="border"
        style={{ ...borderStyle, padding: layout.boxPadding, borderRadius: layout.boxBorderRadius, marginTop: layout.boxMarginTop, minHeight: layout.boxObservationMinHeight }}
      >
        <p className="font-medium" style={{ marginBottom: layout.boxLabelMarginBottom }}>Observação:</p>
        {observation ? (
          <p className="opacity-90" style={{ fontSize: layout.boxObservationContentFontSize, whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "96px", overflowY: "hidden", lineHeight: 1.6 }}>{observation}</p>
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
      className={`pdf-preview-viewport relative flex h-full min-h-0 w-full max-w-full justify-center ${
        minScaleProp != null && minScaleProp > 0 ? "overflow-auto" : "overflow-hidden"
      }`}
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
            padding: isModern ? "20px" : layout.bodyPadding,
            boxSizing: "border-box",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundColor: "#ffffff",
            color: fontColor,
            borderColor: gridColor,
          }}
        >
          {/* Remover as faixas pretas do container - elas estão no modernBodyContent */}

          <div style={{ flex: 1, minHeight: 0, overflow: isModern ? "hidden" : "auto" }}>
            {isModern ? modernBodyContent : previewBodyContent}
          </div>

          {/* Rodapé apenas para o template simples */}
          {!isModern && previewFooter}
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
              padding: isModern ? "20px" : layout.bodyPadding,
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
              {isModern ? modernBodyContent : previewBodyContent}
            </div>
            {!isModern && previewFooter}
          </div>
        </div>
      )}
    </div>
  );
}
