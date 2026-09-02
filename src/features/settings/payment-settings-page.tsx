"use client";

import { PageHeader } from "@/components/ui/page-header";

export function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment"
        description="Online payment providers will be configured here."
      />
      <section className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm font-semibold text-foreground">Coming Soon</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Stripe, PayPal, and other payment gateway settings are not available yet. You can still
          record payments manually from invoices.
        </p>
      </section>
    </div>
  );
}
