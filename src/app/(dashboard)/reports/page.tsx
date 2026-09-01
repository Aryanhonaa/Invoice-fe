import { Suspense } from "react";
import { ReportsPage } from "@/features/reports/reports-page";

export default function ReportsRoute() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading reports…</p>}>
      <ReportsPage />
    </Suspense>
  );
}
