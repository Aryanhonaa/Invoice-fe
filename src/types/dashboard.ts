import type { InvoiceStatus, PaymentStatus } from "@/types/invoice";
import type { UserRole } from "@/types/auth";

export const DASHBOARD_DATE_PRESETS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "last_3_months",
  "last_6_months",
  "this_year",
  "custom",
] as const;

export type DashboardDatePreset = (typeof DASHBOARD_DATE_PRESETS)[number];

export const DASHBOARD_PRESET_LABELS: Record<DashboardDatePreset, string> = {
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  last_6_months: "Last 6 months",
  this_year: "This year",
  custom: "Custom range",
};

export interface DashboardInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  total: string;
  amountPaid: string;
  balanceDue: string;
  dueDate: string;
  currency: string;
  customerName: string;
  organizationName: string | null;
}

export interface DashboardPaymentSummary {
  id: string;
  amount: string;
  currency: string;
  paidAt: string | null;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  organizationName: string | null;
}

export interface DashboardSeriesPoint {
  period: string;
  amount: string;
}

export interface DashboardTeamPerformance {
  teamId: string | null;
  teamName: string;
  invoiceCount: number;
  revenue: string;
  outstanding: string;
}

export interface DashboardTopCustomer {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  total: string;
  paid: string;
  outstanding: string;
}

export interface DashboardOrganizationActivity {
  organizationId: string;
  organizationName: string;
  invoiceCount: number;
  revenue: string;
}

export interface DashboardMetrics {
  organizations: number | null;
  activeOrganizations: number | null;
  inactiveOrganizations: number | null;
  admins: number | null;
  members: number | null;
  teams: number | null;
  customers: number | null;
  invoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  partiallyPaidInvoices: number;
  expenses: string;
  revenue: string;
  paidAmount: string;
  outstandingBalance: string;
  overdueAmount: string;
}

export interface Dashboard {
  role: UserRole;
  scope: "SYSTEM" | "ORGANIZATION" | "MEMBER";
  organizationId: string | null;
  teamId: string | null;
  currency: string;
  granularity: "day" | "month";
  range: { preset: string; start: string; end: string };
  metrics: DashboardMetrics;
  invoiceStatusSeries: Array<{ status: string; count: number }>;
  revenueSeries: DashboardSeriesPoint[];
  paymentSeries: DashboardSeriesPoint[];
  expenseSeries: DashboardSeriesPoint[];
  teamPerformance: DashboardTeamPerformance[];
  topCustomers: DashboardTopCustomer[];
  organizationActivity: DashboardOrganizationActivity[];
  recentInvoices: DashboardInvoiceSummary[];
  recentPayments: DashboardPaymentSummary[];
  overdueInvoices: DashboardInvoiceSummary[];
  organizations: Array<{ id: string; name: string }>;
}
