import { recordTrafficEvent } from "@/services/traffic";
import type { TrafficEventType } from "@/types/traffic";

const VISITOR_STORAGE_KEY = "traffic_visitor_id";
const SESSION_STORAGE_KEY = "traffic_session_id";
const ATTRIBUTION_STORAGE_KEY = "traffic_attribution";
const ENTERED_AT_STORAGE_KEY = "traffic_entered_at";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function getTrafficVisitorId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
    const id = randomId().slice(0, 32);
    localStorage.setItem(VISITOR_STORAGE_KEY, id);
    return id;
  } catch {
    return randomId().slice(0, 32);
  }
}

function readAttribution(): {
  gclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, string | undefined>;
    return {
      gclid: parsed.gclid,
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
    };
  } catch {
    return {};
  }
}

export function captureTrafficAttributionFromUrl(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const payload = {
      gclid: params.get("gclid") ?? undefined,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
    };
    const hasValue = Object.values(payload).some((v) => v != null && v !== "");
    if (hasValue) {
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {
    /* storage indisponível */
  }
}

function getSessionId(): string | undefined {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function setSessionId(sessionId: string): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    /* ignorar */
  }
}

function getEnteredAt(): number | null {
  try {
    const raw = sessionStorage.getItem(ENTERED_AT_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function setEnteredAt(ms: number): void {
  try {
    sessionStorage.setItem(ENTERED_AT_STORAGE_KEY, String(ms));
  } catch {
    /* ignorar */
  }
}

function clearSessionTracking(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ENTERED_AT_STORAGE_KEY);
  } catch {
    /* ignorar */
  }
}

async function sendTrafficEvent(type: TrafficEventType): Promise<void> {
  const visitorId = getTrafficVisitorId();
  if (!visitorId) {
    return;
  }

  const body: Parameters<typeof recordTrafficEvent>[0] = {
    visitorId,
    type,
    sessionId: getSessionId(),
    ...readAttribution(),
  };

  if (type === "SESSION_END") {
    const enteredAt = getEnteredAt();
    if (enteredAt != null) {
      body.durationSeconds = Math.max(0, Math.round((Date.now() - enteredAt) / 1000));
    }
  }

  try {
    const res = await recordTrafficEvent(body);
    if (res.sessionId) {
      setSessionId(res.sessionId);
    }
    if (type === "PAGE_ENTER") {
      setEnteredAt(Date.now());
    }
    if (type === "SESSION_END") {
      clearSessionTracking();
    }
  } catch {
    /* falha silenciosa — não impacta a landing */
  }
}

export function trackLandingPageEnter(): void {
  captureTrafficAttributionFromUrl();
  void sendTrafficEvent("PAGE_ENTER");
}

export function trackLandingTabFeatures(): void {
  void sendTrafficEvent("TAB_FEATURES");
}

export function trackLandingTabPlans(): void {
  void sendTrafficEvent("TAB_PLANS");
}

export function trackLandingClickStartFree(): void {
  void sendTrafficEvent("CLICK_START_FREE");
}

export function trackLandingSessionEnd(): void {
  const sessionId = getSessionId();
  if (!sessionId) {
    return;
  }
  void sendTrafficEvent("SESSION_END");
}
