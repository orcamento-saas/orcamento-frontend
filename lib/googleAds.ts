/** ID da conta Google Ads (gtag). */
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18206448143";

/** Destino do evento de conversão (formato AW-XXXX/label). */
export const GOOGLE_ADS_CONVERSION_SEND_TO =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO?.trim() ||
  "AW-18206448143/tPjZCOuMzrccEI-0welD";

/** Valor mensal do plano Pro exibido no site (R$ 19,90). */
export const GOOGLE_ADS_PRO_PLAN_VALUE_BRL = 19.9;

const CONVERSION_STORAGE_PREFIX = "google_ads_conversion:";

export type TrackGoogleAdsPurchaseParams = {
  transactionId: string;
  value?: number;
  currency?: string;
};

function conversionStorageKey(transactionId: string): string {
  return `${CONVERSION_STORAGE_PREFIX}${transactionId}`;
}

/** Dispara conversão de compra uma vez por transaction_id (sessionStorage). */
export function trackGoogleAdsPurchase({
  transactionId,
  value = GOOGLE_ADS_PRO_PLAN_VALUE_BRL,
  currency = "BRL",
}: TrackGoogleAdsPurchaseParams): void {
  if (typeof window === "undefined") return;

  const id = transactionId.trim();
  if (!id) return;

  const storageKey = conversionStorageKey(id);
  try {
    if (sessionStorage.getItem(storageKey) === "1") return;
  } catch {
    /* sessionStorage indisponível — segue sem deduplicar */
  }

  const gtag = window.gtag;
  if (typeof gtag !== "function") return;

  gtag("event", "conversion", {
    send_to: GOOGLE_ADS_CONVERSION_SEND_TO,
    value,
    currency,
    transaction_id: id,
  });

  try {
    sessionStorage.setItem(storageKey, "1");
  } catch {
    /* ignorar */
  }
}
