import { apiGet, apiPost } from "@/lib/api";

export type BillingMethod = "CREDIT_CARD" | "PIX";

export interface CreateCheckoutResponse {
  checkoutId: string;
  checkoutUrl: string;
}

export interface BillingSubscriptionSummary {
  plan: "FREE" | "PRO";
  subscription: {
    id: string;
    status: "INACTIVE" | "TRIALING" | "ACTIVE" | "OVERDUE" | "CANCELED";
    billingMethod: BillingMethod | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    paidUntil: string | null;
    canceledAt: string | null;
    asaasSubscriptionId: string | null;
  } | null;
}

export interface CancelBillingResponse {
  ok: boolean;
  plan: "FREE" | "PRO";
  keepProUntilEnd: boolean;
  accessUntil: string | null;
}

export async function createBillingCheckout(
  token: string,
  billingMethods: BillingMethod[] = ["CREDIT_CARD"]
): Promise<CreateCheckoutResponse> {
  return apiPost<CreateCheckoutResponse>(
    "billing/checkout",
    { billingMethods },
    token
  );
}

export async function getBillingSubscriptionSummary(
  token: string
): Promise<BillingSubscriptionSummary> {
  return apiGet<BillingSubscriptionSummary>("billing/subscription", token, false);
}

export async function cancelBillingSubscription(
  token: string
): Promise<CancelBillingResponse> {
  return apiPost<CancelBillingResponse>("billing/cancel", {}, token);
}
