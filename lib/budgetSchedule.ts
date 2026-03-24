/** Horário de Brasília na UI; o banco guarda o instante em UTC (ex.: 20:00 BRT → 23:00 UTC). */
export const SCHEDULE_TZ = "America/Sao_Paulo";
/** Desde 2019 o Brasil não usa DST; offset fixo BRT = UTC−3 → UTC = hora local + 3. */
export const BRT_OFFSET_HOURS_TO_UTC = 3;

/** Valor para input datetime-local a partir de ISO (sempre em America/Sao_Paulo). */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function todayYmdBr(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((p) => p.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function buildBrScheduleString(dateYmd: string, hour: number, minute: number): string {
  return `${dateYmd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Interpreta o valor do datetime-local como data/hora civil em Brasília e devolve ISO em UTC. */
export function scheduleBrInputToIsoUtc(scheduleInput: string): string {
  const m = scheduleInput.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    throw new Error("Formato de data e hora inválido.");
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const ms = Date.UTC(y, mo - 1, d, h + BRT_OFFSET_HOURS_TO_UTC, mi, 0, 0);
  return new Date(ms).toISOString();
}

export function formatScheduleDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: SCHEDULE_TZ,
  });
  const timePart = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SCHEDULE_TZ,
  });
  return `${datePart} - ${timePart}`;
}
