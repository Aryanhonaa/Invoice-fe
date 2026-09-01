const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  UNPAID: "Unpaid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NONE: "—",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-indigo-50 text-indigo-800",
  VIEWED: "bg-blue-50 text-blue-800",
  PENDING: "bg-slate-100 text-slate-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800",
  PAID: "bg-emerald-50 text-emerald-800",
  UNPAID: "bg-slate-100 text-slate-700",
  OVERDUE: "bg-red-50 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-500",
  COMPLETED: "bg-emerald-50 text-emerald-800",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-50 text-emerald-800",
  INACTIVE: "bg-slate-100 text-slate-500",
  NONE: "bg-slate-100 text-slate-500",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
