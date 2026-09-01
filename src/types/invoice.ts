import type { OrganizationSummary } from "@/types/admin";
import type { Address, CatalogKind } from "@/types/catalog";
import type { Payment } from "@/types/payment";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "NONE";

export interface InvoiceItem {
  id: string;
  productId: string | null;
  catalogKind: CatalogKind | null;
  sku: string | null;
  unit: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string | null;
  taxAmount: string;
  lineSubtotal: string;
  lineTotal: string;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  createdById: string;
  assignedTeamId: string | null;
  assignedMemberId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
  terms: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  organization: OrganizationSummary | null;
  customer: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    taxNumber: string | null;
  };
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  assignedTeam: { id: string; name: string } | null;
  assignedMember: { id: string; firstName: string; lastName: string; email: string } | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResult {
  items: Invoice[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InvoiceItemFormValues {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
}

export interface InvoiceFormValues {
  customerId: string;
  organizationId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  terms: string;
  assignedTeamId: string;
  assignedMemberId: string;
  items: InvoiceItemFormValues[];
}
