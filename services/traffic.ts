import { apiGet, apiPost } from "@/lib/api";
import type {
  RecordTrafficEventBody,
  TrafficEventResponse,
  TrafficSummaryFilters,
  TrafficSummaryResponse,
} from "@/types/traffic";

const PUBLIC_TRAFFIC_EVENTS = "public/traffic/events";
const ADMIN_TRAFFIC_SUMMARY = "admin/traffic/summary";

export async function recordTrafficEvent(
  body: RecordTrafficEventBody
): Promise<TrafficEventResponse> {
  return apiPost<TrafficEventResponse>(PUBLIC_TRAFFIC_EVENTS, body);
}

export async function getAdminTrafficSummary(
  token: string,
  filters: TrafficSummaryFilters
): Promise<TrafficSummaryResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("from", filters.from);
  searchParams.set("to", filters.to);
  return apiGet<TrafficSummaryResponse>(
    `${ADMIN_TRAFFIC_SUMMARY}?${searchParams.toString()}`,
    token,
    false
  );
}
