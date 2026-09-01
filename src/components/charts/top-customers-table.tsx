"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/invoice-calc";
import type { DashboardTopCustomer } from "@/types/dashboard";

interface TopCustomersTableProps {
  customers: DashboardTopCustomer[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function TopCustomersTable({
  customers,
  currency,
  loading,
  error,
}: TopCustomersTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top customers</h3>
          <p className="mt-1 text-xs text-slate-500">Ranked by invoice amount in this period</p>
        </div>
        <Link href="/customers" className="text-xs font-medium text-slate-600 hover:underline">
          View all
        </Link>
      </header>
      {loading ? (
        <div className="p-5">
          <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : error ? (
        <p role="alert" className="px-5 py-8 text-sm text-red-700">
          {error}
        </p>
      ) : customers.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">No customer invoice data available for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Invoices</th>
                <th className="px-5 py-3 font-medium">Invoiced</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customerId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    <Link href={`/customers/${customer.customerId}`} className="hover:underline">
                      {customer.customerName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{customer.invoiceCount}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatMoney(customer.total, currency)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatMoney(customer.paid, currency)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {formatMoney(customer.outstanding, currency)}
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
