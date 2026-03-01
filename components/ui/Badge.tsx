import type { BudgetStatus } from "@/types/budget";

const statusConfig: Record<
  BudgetStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Rascunho",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  SENT: {
    label: "Enviado",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  SIGNED: {
    label: "Assinado",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export function StatusBadge({ status }: { status: BudgetStatus }) {
  if (status === "SENT") return null;
  const { label, className } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
