/**
 * Definições de layout dos orçamentos (PDF e preview no front).
 * O backend é a fonte de verdade do layout (src/layouts/budgetLayouts.ts).
 * Este módulo expõe apenas os tipos e funções para buscar os layouts via API pública.
 */

import { apiGet } from "@/lib/api";

export type LayoutId = "simples" | "moderno";

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
  /** Altura total do conteúdo (px/mm) usada no PDF */
  bodyHeight: string;
  /** Margem inferior do cabeçalho (px) */
  headerMarginBottom: number;
  /** Largura e altura da logo (px) */
  logoWidth: number;
  logoHeight: number;
  logoBorderRadius: number;
  logoPlaceholderFontSize: number;
  logoPlaceholderPadding: number;
  /** Largura da coluna direita (bloco ORÇAMENTO, em px) */
  infoRightWidth: number;
  /** Margem dos parágrafos do bloco esquerdo (ex: "4px 0") */
  infoLeftParagraphMargin: string;
  /** Margem da página A4 no PDF (ex: "8mm") */
  pageMargin: string;
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
  /** Bloco de assinatura (PDF assinado) */
  signatureBlockFontSizeSmall: number;
  signatureBlockFontSizeNormal: number;
  signatureBlockSpacing: number;
  signatureImageMaxWidth: number;
  signatureImageMaxHeight: number;
  /** Rodapé */
  footerPaddingTop: number;
  footerPaddingBottom: number;
  footerFontSize: number;
  footerLineHeight: number;
  footerLineGap: number;
  /** Fonte principal (Google Fonts ou system) */
  fontFamily: string;
}

const DEFAULT_LAYOUT_ID: LayoutId = "simples";

/**
 * Busca um layout pelo id na API pública do backend.
 * Sempre retorna um layout válido (o backend faz fallback para o simples).
 */
export async function fetchBudgetLayout(
  id: string | null | undefined
): Promise<BudgetLayoutConfig> {
  const layoutId = (id ?? DEFAULT_LAYOUT_ID) as LayoutId;
  return apiGet<BudgetLayoutConfig>(`public/layouts/${layoutId}`);
}

/**
 * Lista de layouts disponíveis (para montar seleção no front).
 */
export async function fetchAvailableLayouts(): Promise<BudgetLayoutConfig[]> {
  const { layouts } = await apiGet<{ layouts: BudgetLayoutConfig[] }>(
    "public/layouts"
  );
  return layouts;
}
