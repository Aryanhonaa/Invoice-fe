import Link from "next/link";
import { formatMoney } from "@/lib/invoice-calc";
import type { DashboardInvoiceSummary, DashboardPaymentSummary } from "@/types/dashboard";

export function InvoiceSummaryTable({
  title,
  empty,
  invoices,
  showOrganization,
}: {
  title: string;
  empty: string;
  invoices: DashboardInvoiceSummary[];
  showOrganization?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <Link href="/invoices" className="text-xs font-medium text-slate-600 hover:underline">
          View all
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                {showOrganization ? <th className="px-5 py-3 font-medium">Organization</th> : null}
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{invoice.customerName}</td>
                  {showOrganization ? (
                    <td className="px-5 py-3 text-slate-600">{invoice.organizationName ?? "—"}</td>
                  ) : null}
                  <td className="px-5 py-3 text-slate-600">{invoice.dueDate.slice(0, 10)}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{invoice.status.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function PaymentSummaryTable({
  title,
  empty,
  payments,
  showOrganization,
}: {
  title: string;
  empty: string;
  payments: DashboardPaymentSummary[];
  showOrganization?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <Link href="/payments" className="text-xs font-medium text-slate-600 hover:underline">
          View all
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                {showOrganization ? <th className="px-5 py-3 font-medium">Organization</th> : null}
                <th className="px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-600">
                    {(payment.paidAt ?? "").slice(0, 10) || "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    <Link href={`/invoices/${payment.invoiceId}`} className="hover:underline">
                      {payment.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{payment.customerName}</td>
                  {showOrganization ? (
                    <td className="px-5 py-3 text-slate-600">{payment.organizationName ?? "—"}</td>
                  ) : null}
                  <td className="px-5 py-3 text-slate-600">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
