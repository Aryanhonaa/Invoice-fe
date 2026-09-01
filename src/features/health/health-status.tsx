"use client";

import { useHealth } from "@/hooks/use-health";

export function HealthStatus() {
  const { status, data, error } = useHealth();

  if (status === "loading") {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm font-medium text-slate-500">Checking API status…</p>
        <div className="mt-4 h-2 w-40 animate-pulse rounded bg-slate-200" />
      </section>
    );
  }

  if (status === "error") {
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6"
      >
        <h2 className="text-sm font-semibold text-red-800">API unavailable</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <p className="mt-3 text-xs text-red-600">
          Start the backend with <code className="font-mono">npm run dev</code> in{" "}
          <code className="font-mono">/be</code>.
        </p>
      </section>
    );
  }

  const databaseConnected = data?.database === "connected";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        System status
      </h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <StatusItem label="API" value={data?.service ?? "unknown"} ok />
        <StatusItem
          label="Database"
          value={data?.database ?? "unknown"}
          ok={databaseConnected}
        />
        <StatusItem label="Checked at" value={formatTimestamp(data?.timestamp)} />
      </dl>
      {!databaseConnected ? (
        <p className="mt-4 text-xs text-amber-700">
          The API is running, but PostgreSQL is not connected. Start the database
          and run Prisma migrations.
        </p>
      ) : null}
    </section>
  );
}

function StatusItem({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">
        {ok === undefined ? (
          value
        ) : (
          <span className={ok ? "text-emerald-700" : "text-amber-700"}>{value}</span>
        )}
      </dd>
    </div>
  );
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
