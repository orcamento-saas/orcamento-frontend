function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function resolveBudgetShareSenderLabel(
  companyName?: string | null,
  senderName?: string | null
): string {
  const company = companyName?.trim();
  if (company) return company;
  const name = senderName?.trim();
  if (name) return name;
  return "Sua empresa";
}

export function resolveBudgetShareClientLabel(clientName?: string | null): string {
  const name = clientName?.trim();
  return name || "Cliente";
}

const URL_IN_TEXT_REGEX = /(https?:\/\/[^\s<]+[^\s.,;:!?)\]}>]*)/gi;

export function getBudgetPublicUrl(
  budgetId: string,
  origin?: string
): string {
  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/budget/${budgetId}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML para área de transferência (links clicáveis ao colar no e-mail, etc.). */
export function plainTextToClipboardHtml(text: string): string {
  const escaped = escapeHtml(text);
  const withBreaks = escaped.replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
  const withLinks = withBreaks.replace(URL_IN_TEXT_REGEX, (url) => {
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}">${safeUrl}</a>`;
  });
  return `<div>${withLinks}</div>`;
}

export function buildBudgetShareMessage(params: {
  budgetId: string;
  title: string;
  value: number;
  clientName?: string | null;
  companyName?: string | null;
  senderName?: string | null;
  origin?: string;
}): string {
  const url = getBudgetPublicUrl(params.budgetId, params.origin);
  const client = resolveBudgetShareClientLabel(params.clientName);
  const sender = resolveBudgetShareSenderLabel(
    params.companyName,
    params.senderName
  );
  const serviceTitle = params.title?.trim() || "Orçamento";
  const valueFormatted = formatCurrency(params.value);

  return [
    `Olá, *${client}*! 👋`,
    "",
    "Conforme conversamos, segue o orçamento referente ao serviço abaixo:",
    "",
    `📄 *Serviço:* ${serviceTitle}`,
    `💰 *Valor:* ${valueFormatted}`,
    "",
    "Para visualizar e assinar, acesse o link abaixo:",
    url,
    "",
    "Qualquer dúvida, estou à disposição.",
    `*${sender}*`,
  ].join("\n");
}
