"use client";

import type { DashboardOrganizationActivity } from "@/types/dashboard";
import { CategoryBarChart } from "./category-bar-chart";

interface OrganizationActivityChartProps {
  organizations: DashboardOrganizationActivity[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function OrganizationActivityChart({
  organizations,
  currency,
  loading,
  error,
}: OrganizationActivityChartProps) {
  return (
    <CategoryBarChart
      title="Organization activity"
      subtitle="Collected revenue by organization"
      points={organizations.map((organization) => ({
        label: organization.organizationName,
        amount: organization.revenue,
      }))}
      currency={currency}
      emptyMessage="No organization activity for this period."
      loading={loading}
      error={error}
    />
  );
}
