/**
 * Formata datas vindas da API (ISO UTC). Usa dia/mês/ano em UTC para não “voltar um dia”
 * no Brasil quando o backend grava meia-noite UTC (ex.: vencimento 01/04 virava 31/03 na tela).
 */
export function formatDateBr(iso: string | null | undefined): string {
  if (!iso) return "Não informado";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Não informado";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
