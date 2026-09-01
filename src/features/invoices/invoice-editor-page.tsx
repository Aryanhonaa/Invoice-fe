"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { InvoiceForm, valuesFromInvoice } from "@/features/invoices/invoice-form";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { listCustomers } from "@/services/customers.service";
import { createInvoice, getInvoice, updateInvoice } from "@/services/invoices.service";
import { listMembers } from "@/services/members.service";
import { listProducts } from "@/services/products.service";
import { listTeams } from "@/services/teams.service";
import type { Customer, Product } from "@/types/catalog";
import type { InvoiceFormValues } from "@/types/invoice";
import type { MemberUser } from "@/types/member";
import type { Team } from "@/types/team";

interface InvoiceEditorPageProps {
  invoiceId?: string;
}

export function InvoiceEditorPage({ invoiceId }: InvoiceEditorPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const canCreate = hasPermission(user, "INVOICES_CREATE");
  const canUpdate = hasPermission(user, "INVOICES_UPDATE");
  const canCreateCustomer = hasPermission(user, "CUSTOMERS_CREATE");
  const canListOrgMembers = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [initialValues, setInitialValues] = useState<Partial<InvoiceFormValues> | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!invoiceId && !canCreate) {
        setError("You can inspect invoices but cannot create them.");
        return;
      }
      if (invoiceId && !canUpdate) {
        setError("You can inspect invoices but cannot edit them.");
        return;
      }
      const [customerResult, productResult, teamResult, memberResult, invoice] =
        await Promise.all([
          listCustomers({ status: "ACTIVE", pageSize: 50 }),
          listProducts({ status: "ACTIVE", pageSize: 50 }),
          listTeams({ status: "ACTIVE", pageSize: 50 }),
          canListOrgMembers
            ? listMembers({ status: "ACTIVE", pageSize: 50 })
            : Promise.resolve({ items: [] as MemberUser[] }),
          invoiceId ? getInvoice(invoiceId) : Promise.resolve(null),
        ]);
      if (invoice && invoice.status !== "DRAFT") {
        setError("Only draft invoices can be edited.");
        return;
      }
      setCustomers(customerResult.items);
      setProducts(productResult.items);
      setTeams(teamResult.items);
      setMembers(
        canListOrgMembers
          ? memberResult.items
          : user
            ? [
                {
                  ...user,
                  organization: null,
                  teams: [],
                },
              ]
            : [],
      );
      setInitialValues(invoice ? valuesFromInvoice(invoice) : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load the invoice form.");
    } finally {
      setLoading(false);
    }
  }, [canCreate, canListOrgMembers, canUpdate, invoiceId, user]);

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

  async function handleSubmit(values: InvoiceFormValues) {
    setBusy(true);
    try {
      const saved = invoiceId
        ? await updateInvoice(invoiceId, values)
        : await createInvoice(values);
      notify(invoiceId ? "Invoice updated successfully." : "Invoice created successfully.");
      router.push(`/invoices/${saved.id}`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "We couldn't save this invoice.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/invoices" className="hover:underline">
            Invoices
          </Link>
          <span className="mx-2">/</span>
          {invoiceId ? "Edit" : "New"}
        </p>
        <PageHeader
          title={invoiceId ? "Edit invoice" : "Create invoice"}
          description={
            invoiceId
              ? "Update this draft, then send it from the invoice page."
              : "Follow the steps to bill a customer. You can save a draft when you are done."
          }
        />
      </div>
      {loading ? (
        <TableSkeleton cols={3} rows={4} />
      ) : error && !initialValues && invoiceId ? (
        <div role="alert" className="rounded-[12px] border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <InvoiceForm
          mode={invoiceId ? "edit" : "create"}
          customers={customers}
          products={products}
          teams={teams}
          members={members}
          canCreateCustomer={canCreateCustomer}
          initialValues={initialValues}
          busy={busy}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
