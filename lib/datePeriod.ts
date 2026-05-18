export type RangePreset = "today" | "yesterday" | "next7" | "custom";

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function buildPeriod(
  preset: RangePreset,
  customStart: string,
  customEnd: string
): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (preset === "today") {
    return { start: todayStart, end: todayEnd };
  }

  if (preset === "yesterday") {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }

  if (preset === "next7") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 6);
    return { start: startOfDay(startDate), end: todayEnd };
  }

  const parsedStart = customStart ? new Date(`${customStart}T00:00:00`) : todayStart;
  const parsedEnd = customEnd ? new Date(`${customEnd}T23:59:59.999`) : todayEnd;
  if (parsedStart > parsedEnd) {
    return { start: startOfDay(parsedEnd), end: endOfDay(parsedStart) };
  }
  return { start: parsedStart, end: parsedEnd };
}
