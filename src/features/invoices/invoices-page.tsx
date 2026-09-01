"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClickableRow, DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge, statusLabel } from "@/components/ui/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { listCustomers } from "@/services/customers.service";
import { listInvoices } from "@/services/invoices.service";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { hasPermission } from "@/lib/permissions";
import type { Customer } from "@/types/catalog";
import type { InvoiceListResult, InvoiceStatus } from "@/types/invoice";

const statuses: InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

export function InvoicesPage() {
  const { user } = useAuth();
  const { organizationId, teamId, tenantListsReady, scopeLabel } = useWorkspace();
  const canCreate = hasPermission(user, "INVOICES_CREATE");
  const requestIdRef = useRef(0);
  const router = useRouter();

  const [result, setResult] = useState<InvoiceListResult | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [customerId, setCustomerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const activeFilterCount = [status, customerId, dateFrom, dateTo].filter(Boolean).length;
  const hasFilters = Boolean(debouncedSearch || activeFilterCount);

  const load = useCallback(async () => {
    if (!tenantListsReady) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [invoices, customerResult] = await Promise.all([
        listInvoices({
          search: debouncedSearch || undefined,
          status,
          customerId: customerId || undefined,
          organizationId: organizationId || undefined,
          teamId: teamId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sort,
          sortDir,
          page,
          pageSize: 10,
        }),
        listCustomers({
          pageSize: 50,
          organizationId: organizationId || undefined,
        }),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResult(invoices);
      setCustomers(customerResult.items);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof ApiError ? err.message : "We couldn't load your invoices.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    customerId,
    dateFrom,
    dateTo,
    debouncedSearch,
    organizationId,
    page,
    sort,
    sortDir,
    status,
    teamId,
    tenantListsReady,
  ]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCustomerId("");
    setDateFrom("");
    setDateTo("");
    setSort("createdAt");
    setSortDir("desc");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={
          canCreate
            ? `Create, send, and track invoices. ${scopeLabel}.`
            : `Inspect invoices for ${scopeLabel}. Editing is limited to operations members.`
        }
        actions={
          canCreate ? (
            <Link href="/invoices/new">
              <Button>Create invoice</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Search" htmlFor="invoice-search">
            <TextInput
              id="invoice-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search invoices by number or customer"
            />
          </Field>
        </div>
        <Button variant="secondary" onClick={() => setFiltersOpen((open) => !open)}>
          Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
        {hasFilters ? (
          <Button variant="ghost" onClick={clearFilters}>
            Clear all
          </Button>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className="grid gap-3 rounded-[12px] border border-border bg-surface p-4 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Status" htmlFor="invoice-status">
            <SelectInput
              id="invoice-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as InvoiceStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Customer" htmlFor="invoice-customer-filter">
            <SelectInput
              id="invoice-customer-filter"
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="From" htmlFor="invoice-from">
            <TextInput
              id="invoice-from"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="To" htmlFor="invoice-to">
            <TextInput
              id="invoice-to"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Sort" htmlFor="invoice-sort">
            <SelectInput
              id="invoice-sort"
              value={`${sort}:${sortDir}`}
              onChange={(event) => {
                const [nextSort, nextDir] = event.target.value.split(":");
                setSort(nextSort);
                setSortDir(nextDir as "asc" | "desc");
              }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="dueDate:asc">Due date</option>
              <option value="total:desc">Highest total</option>
              <option value="invoiceNumber:asc">Invoice number</option>
            </SelectInput>
          </Field>
        </div>
      ) : null}

      {!tenantListsReady ? (
        <EmptyState
          title="Select an organization"
          description="Choose an organization in the workspace switcher to view that tenant's invoices."
        />
      ) : loading && !result ? (
        <TableSkeleton cols={5} />
      ) : error && !result ? (
        <ErrorState title="We couldn't load your invoices." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No invoices match these filters" : "No invoices yet"}
          description={
            hasFilters
              ? "Try a different search or clear the filters."
              : "Create your first invoice to start tracking billing."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Link href="/invoices/new">
                <Button>Create invoice</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th>Due date</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((invoice) => (
                <ClickableRow key={invoice.id} onClick={() => router.push(`/invoices/${invoice.id}`)}>
                  <Td>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </Td>
                  <Td muted>{invoice.customer.name}</Td>
                  <Td muted>{invoice.invoiceDate.slice(0, 10)}</Td>
                  <Td muted>{invoice.dueDate.slice(0, 10)}</Td>
                  <Td className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</Td>
                  <Td>
                    <StatusBadge status={invoice.status} />
                  </Td>
                  <Td className="text-right">
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu
                        items={[
                          { label: "View", onClick: () => router.push(`/invoices/${invoice.id}`) },
                          ...(invoice.status === "DRAFT"
                            ? [{ label: "Edit", onClick: () => router.push(`/invoices/${invoice.id}/edit`) }]
                            : []),
                        ]}
                      />
                    </div>
                  </Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}
    </div>
  );
}
