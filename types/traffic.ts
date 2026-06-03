export type TrafficEventType =
  | "PAGE_ENTER"
  | "TAB_FEATURES"
  | "TAB_PLANS"
  | "CLICK_START_FREE"
  | "SESSION_END";

export interface RecordTrafficEventBody {
  visitorId: string;
  type: TrafficEventType;
  sessionId?: string;
  durationSeconds?: number;
  gclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface TrafficEventResponse {
  sessionId: string;
}

export interface TrafficSummaryResponse {
  visits: number;
  avgDurationSeconds: number | null;
  viewedFeatures: number;
  viewedPlans: number;
  clickedStartFree: number;
}

export interface TrafficSummaryFilters {
  from: string;
  to: string;
}
