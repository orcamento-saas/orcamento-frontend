export type MeasureType = "UN" | "M" | "L";

export const MEASURE_OPTIONS: { value: MeasureType; label: string }[] = [
  { value: "UN", label: "Unidades" },
  { value: "M", label: "Metros" },
  { value: "L", label: "Litros" },
];

export function getMeasureConfig(type: MeasureType) {
  if (type === "M") {
    return {
      quantityLabel: "Qtd (m)",
      unitPriceLabel: "Valor por metro",
      quantityStep: 0.01,
    };
  }
  if (type === "L") {
    return {
      quantityLabel: "Qtd (L)",
      unitPriceLabel: "Valor por litro",
      quantityStep: 0.01,
    };
  }
  return {
    quantityLabel: "Qtd",
    unitPriceLabel: "Valor un.",
    quantityStep: 1,
  };
}

export function parseMeasureQuantity(raw: string, type: MeasureType): number {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return 0;

  const parsed =
    type === "UN" ? Number.parseInt(normalized, 10) : Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  if (type === "UN") {
    return Math.round(parsed);
  }

  return Math.round(parsed * 100) / 100;
}
