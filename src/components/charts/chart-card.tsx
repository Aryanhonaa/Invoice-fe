"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CHART_HEIGHT } from "./chart-theme";

function subscribe() {
  return () => undefined;
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  loading = false,
  error,
  empty,
  emptyMessage,
  children,
}: ChartCardProps) {
  const mounted = useIsClient();

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <header className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </header>
      <div className="min-w-0 p-5" style={{ minHeight: CHART_HEIGHT }}>
        {loading || !mounted ? (
          <div
            className="animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            style={{ height: CHART_HEIGHT - 24 }}
            aria-hidden
          />
        ) : error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : empty ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <div className="w-full min-w-0" style={{ height: CHART_HEIGHT - 24 }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
