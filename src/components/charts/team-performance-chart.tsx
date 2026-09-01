"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/invoice-calc";
import type { DashboardTeamPerformance } from "@/types/dashboard";
import { ChartCard } from "./chart-card";
import { CHART_COLORS, formatPlotMoney, tooltipStyle } from "./chart-theme";

interface TeamPerformanceChartProps {
  teams: DashboardTeamPerformance[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function TeamPerformanceChart({
  teams,
  currency,
  loading,
  error,
}: TeamPerformanceChartProps) {
  const data = teams.map((team) => ({
    label: team.teamName,
    value: Number(team.revenue),
    invoices: team.invoiceCount,
    outstanding: team.outstanding,
  }));

  return (
    <ChartCard
      title="Team performance"
      subtitle="Collected revenue by assigned team"
      loading={loading}
      error={error}
      empty={teams.length === 0 || teams.every((team) => team.revenue === "0.0000")}
      emptyMessage="No team performance data available for this period."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value: number) => formatPlotMoney(value, currency)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, _name, item) => {
              const payload = item.payload as { invoices: number; outstanding: string };
              return [
                `${formatPlotMoney(Number(value ?? 0), currency)} · ${payload.invoices} invoices · outstanding ${formatMoney(payload.outstanding, currency)}`,
                "Revenue",
              ];
            }}
          />
          <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
