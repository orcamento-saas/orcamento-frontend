/**
 * Definições de layout dos orçamentos (PDF e preview no front).
 * Back usa aqui para gerar o PDF; front pode copiar este arquivo para ter os mesmos valores sem GET.
 */

export type LayoutId = "simples" | "moderno" | "profissional";

export interface BudgetLayoutConfig {
  id: LayoutId;
  name: string;
  /** Descrição opcional para o front (ex.: "Layout limpo com bordas arredondadas") */
  description?: string;
  /** Padding do body: top right bottom left (ex: "12px 12px 0 12px") */
  bodyPadding: string;
  bodyFontSize: number;
  bodyLineHeight: number;
  /** Altura mínima do conteúdo (ex: "261mm" para A4) */
  bodyMinHeight: string;
  /** Margem inferior do cabeçalho (px) */
  headerMarginBottom: number;
  /** Largura e altura da logo (px) */
  logoWidth: number;
  logoHeight: number;
  logoBorderRadius: number;
  /** Tamanho do nome da empresa no centro (ex: "1.125rem") */
  headerCenterFontSize: string;
  /** Bloco Cliente | ORÇAMENTO */
  infoBlockBorderRadius: number;
  infoBlockPadding: number;
  infoLeftFontSize: number;
  infoRightTitFontSize: string;
  infoRightDateFontSize: number;
  infoRightDateMarginTop: number;
  /** Tabela de itens */
  tableMarginTop: number;
  tableBorder: boolean;
  tableCellPadding: string;
  tableCellFontSize: number;
  tableThFontSize: number;
  /** Número mínimo de linhas na tabela (incluindo vazias) */
  minItemRows: number;
  /** Resumo (Válido por X dias + Total) */
  summaryMarginTop: number;
  validityFontSize: number;
  totalLabelFontSize: string;
  totalValuePadding: string;
  totalValueBorderRadius: number;
  totalValueFontSize: string;
  totalWrapGap: number;
  /** Caixas (Assinatura, Observação) */
  boxPadding: number;
  boxBorderRadius: number;
  boxMarginTop: number;
  boxLabelMarginBottom: number;
  signatureLineMinHeight: number;
  boxObservationMinHeight: number;
  boxObservationContentFontSize: number;
  /** Rodapé */
  footerPaddingTop: number;
  footerFontSize: number;
  footerLineGap: number;
  /** Fonte principal (Google Fonts ou system) */
  fontFamily: string;
}

const LAYOUT_SIMPLES: BudgetLayoutConfig = {
  id: "simples",
  name: "Simples",
  description: "Layout limpo com bordas arredondadas",
  bodyPadding: "12px 12px 0 12px",
  bodyFontSize: 14,
  bodyLineHeight: 1.4,
  bodyMinHeight: "261mm",
  headerMarginBottom: 32,
  logoWidth: 96,
  logoHeight: 96,
  logoBorderRadius: 8,
  headerCenterFontSize: "1.125rem",
  infoBlockBorderRadius: 8,
  infoBlockPadding: 12,
  infoLeftFontSize: 13,
  infoRightTitFontSize: "1rem",
  infoRightDateFontSize: 12,
  infoRightDateMarginTop: 6,
  tableMarginTop: 12,
  tableBorder: true,
  tableCellPadding: "6px 8px",
  tableCellFontSize: 12,
  tableThFontSize: 11,
  minItemRows: 10,
  summaryMarginTop: 12,
  validityFontSize: 13,
  totalLabelFontSize: "1.125rem",
  totalValuePadding: "4px 12px",
  totalValueBorderRadius: 8,
  totalValueFontSize: "1rem",
  totalWrapGap: 10,
  boxPadding: 12,
  boxBorderRadius: 8,
  boxMarginTop: 12,
  boxLabelMarginBottom: 8,
  signatureLineMinHeight: 32,
  boxObservationMinHeight: 168,
  boxObservationContentFontSize: 13,
  footerPaddingTop: 12,
  footerFontSize: 12,
  footerLineGap: 2,
  fontFamily: "'Inter', system-ui, sans-serif",
};

/** Placeholder: mesmo estilo do simples até ter layout próprio. */
const LAYOUT_MODERNO: BudgetLayoutConfig = {
  ...LAYOUT_SIMPLES,
  id: "moderno",
  name: "Moderno",
  description: "Layout moderno (em breve)",
};

/** Placeholder: mesmo estilo do simples até ter layout próprio. */
const LAYOUT_PROFISSIONAL: BudgetLayoutConfig = {
  ...LAYOUT_SIMPLES,
  id: "profissional",
  name: "Profissional",
  description: "Layout profissional (em breve)",
};

/**
 * Map de todos os layouts disponíveis.
 * Back usa getBudgetLayout(id) para gerar PDF.
 */
export const BUDGET_LAYOUTS: Record<LayoutId, BudgetLayoutConfig> = {
  simples: LAYOUT_SIMPLES,
  moderno: LAYOUT_MODERNO,
  profissional: LAYOUT_PROFISSIONAL,
};

/** Layout padrão quando não informado (ex.: orçamentos antigos) */
export const DEFAULT_LAYOUT_ID: LayoutId = "simples";

/**
 * Retorna a config do layout. Sempre retorna um layout válido (fallback para simples).
 */
export function getBudgetLayout(id: string | null | undefined): BudgetLayoutConfig {
  const key = (id ?? DEFAULT_LAYOUT_ID) as LayoutId;
  if (key in BUDGET_LAYOUTS) return BUDGET_LAYOUTS[key as LayoutId];
  return LAYOUT_SIMPLES;
}

/**
 * Lista de layouts disponíveis para o front (lista para seleção).
 */
export function getAvailableLayouts(): BudgetLayoutConfig[] {
  return Object.values(BUDGET_LAYOUTS);
}
