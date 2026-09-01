"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { FormSection, MoreOptions } from "@/components/ui/form-section";
import { Surface } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { CustomerForm } from "@/features/customers/customer-form";
import { calculateInvoiceTotals, formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { invoiceFormSchema } from "@/schemas/invoice";
import { createCustomer } from "@/services/customers.service";
import { useToast } from "@/providers/toast-provider";
import type { OrganizationSummary } from "@/types/admin";
import type { Customer, CustomerFormValues, Product } from "@/types/catalog";
import type { Invoice, InvoiceFormValues, InvoiceItemFormValues } from "@/types/invoice";
import type { MemberUser } from "@/types/member";
import type { Team } from "@/types/team";

interface InvoiceFormProps {
  mode: "create" | "edit";
  requireOrganization: boolean;
  organizations: OrganizationSummary[];
  customers: Customer[];
  products: Product[];
  teams: Team[];
  members: MemberUser[];
  canCreateCustomer?: boolean;
  initialValues?: Partial<InvoiceFormValues>;
  busy: boolean;
  error?: string | null;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
}

const emptyItem: InvoiceItemFormValues = {
  productId: "",
  description: "",
  quantity: "1",
  unitPrice: "",
  discount: "0",
  taxRate: "",
};

const STEPS = [
  { id: "customer", label: "Customer", description: "Who you are billing" },
  { id: "details", label: "Details", description: "Dates and currency" },
  { id: "items", label: "Items", description: "What you are charging" },
  { id: "review", label: "Review", description: "Check and save" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function InvoiceForm({
  mode,
  requireOrganization,
  organizations,
  customers,
  products,
  teams,
  members,
  canCreateCustomer = true,
  initialValues,
  busy,
  error,
  onSubmit,
}: InvoiceFormProps) {
  const { notify } = useToast();
  const [step, setStep] = useState(0);
  const [highestReached, setHighestReached] = useState(0);
  const [addedCustomers, setAddedCustomers] = useState<Customer[]>([]);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [customerBusy, setCustomerBusy] = useState(false);
  const [values, setValues] = useState<InvoiceFormValues>({
    customerId: initialValues?.customerId ?? "",
    organizationId: initialValues?.organizationId ?? "",
    invoiceNumber: initialValues?.invoiceNumber ?? "",
    invoiceDate: initialValues?.invoiceDate ?? today(),
    dueDate: initialValues?.dueDate ?? inDays(14),
    currency: initialValues?.currency ?? "USD",
    notes: initialValues?.notes ?? "",
    terms: initialValues?.terms ?? "Payment due within 14 days.",
    assignedTeamId: initialValues?.assignedTeamId ?? "",
    assignedMemberId: initialValues?.assignedMemberId ?? "",
    items: initialValues?.items?.length ? initialValues.items : [{ ...emptyItem }],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const customerList = useMemo(() => {
    const ids = new Set(customers.map((customer) => customer.id));
    return [...addedCustomers.filter((customer) => !ids.has(customer.id)), ...customers];
  }, [addedCustomers, customers]);

  const selectedCustomer = customerList.find((customer) => customer.id === values.customerId);
  const totals = useMemo(() => {
    try {
      return calculateInvoiceTotals(
        values.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
        })),
      );
    } catch {
      return {
        subtotal: "0.0000",
        discountAmount: "0.0000",
        taxAmount: "0.0000",
        total: "0.0000",
      };
    }
  }, [values.items]);

  function update<K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<InvoiceItemFormValues>) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function applyProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateItem(index, {
      productId,
      description: product?.name ?? values.items[index].description,
      unitPrice: product ? String(product.unitPrice) : values.items[index].unitPrice,
      taxRate:
        product?.taxRate === null || product?.taxRate === undefined
          ? values.items[index].taxRate
          : String(product.taxRate),
    });
    if (product?.currency) {
      update("currency", product.currency);
    }
  }

  function goTo(next: number) {
    setStep(next);
    setHighestReached((current) => Math.max(current, next));
    setFormError(null);
  }

  function validateStep(index: number): boolean {
    if (index === 0) {
      if (requireOrganization && !values.organizationId) {
        setFormError("Please select an organization before continuing.");
        return false;
      }
      if (!values.customerId) {
        setFormError("Please select a customer before continuing.");
        return false;
      }
      return true;
    }
    if (index === 1) {
      if (!values.invoiceDate) {
        setFormError("Invoice date is required.");
        return false;
      }
      if (!values.dueDate) {
        setFormError("Please set a due date before continuing.");
        return false;
      }
      if (!values.currency.trim()) {
        setFormError("Currency is required.");
        return false;
      }
      return true;
    }
    if (index === 2) {
      const parsed = invoiceFormSchema.shape.items.safeParse(values.items);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Add at least one complete line item.");
        return false;
      }
      return true;
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) {
      return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  async function save() {
    const parsed = invoiceFormSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    if (requireOrganization && !values.organizationId) {
      setFormError("Organization is required");
      return;
    }
    setFormError(null);
    await onSubmit(values);
  }

  async function handleCreateCustomer(formValues: CustomerFormValues) {
    setCustomerBusy(true);
    try {
      const created = await createCustomer(formValues);
      setAddedCustomers((current) => [created, ...current]);
      update("customerId", created.id);
      if (formValues.organizationId) {
        update("organizationId", formValues.organizationId);
      }
      setAddCustomerOpen(false);
      notify("Customer added.");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to add customer.", "error");
    } finally {
      setCustomerBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper
        steps={STEPS}
        current={step}
        highestReached={highestReached}
        onStepSelect={(index) => {
          if (index < step || validateStep(step)) {
            goTo(index);
          }
        }}
      />

      {step === 0 ? (
        <Surface>
          <FormSection title="Customer" description="Who are you billing?">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Customer"
                htmlFor="invoice-customer"
                required
                hint="Choose an existing customer, or add a new one."
              >
                <SelectInput
                  id="invoice-customer"
                  value={values.customerId}
                  onChange={(event) => update("customerId", event.target.value)}
                  required
                  aria-invalid={!values.customerId && Boolean(formError)}
                >
                  <option value="">Select a customer</option>
                  {customerList.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.company ? ` — ${customer.company}` : ""}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            {canCreateCustomer ? (
              <div className="pt-2">
                <Button type="button" variant="outline" onClick={() => setAddCustomerOpen(true)}>
                  Add new customer
                </Button>
              </div>
            ) : null}
          </FormSection>
        </Surface>
      ) : null}

      {step === 1 ? (
        <Surface>
          <FormSection title="Invoice details" description="When should this invoice be paid?">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Invoice date" htmlFor="invoice-date" required hint="Defaults to today.">
                <TextInput
                  id="invoice-date"
                  type="date"
                  value={values.invoiceDate}
                  onChange={(event) => update("invoiceDate", event.target.value)}
                  required
                />
              </Field>
              <Field
                label="Due date"
                htmlFor="invoice-due"
                required
                hint="When the customer should pay. Defaults to 14 days from today."
              >
                <TextInput
                  id="invoice-due"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) => update("dueDate", event.target.value)}
                  required
                />
              </Field>
              <Field label="Currency" htmlFor="invoice-currency" required>
                <TextInput
                  id="invoice-currency"
                  value={values.currency}
                  onChange={(event) => update("currency", event.target.value)}
                  placeholder="USD"
                  required
                />
              </Field>
              <Field
                label="Invoice number"
                htmlFor="invoice-number"
                hint={mode === "create" ? "Leave blank to generate one automatically." : undefined}
              >
                <TextInput
                  id="invoice-number"
                  value={values.invoiceNumber}
                  onChange={(event) => update("invoiceNumber", event.target.value)}
                  placeholder={mode === "create" ? "Generated if left blank" : undefined}
                />
              </Field>
            </div>
          </FormSection>
        </Surface>
      ) : null}

      {step === 2 ? (
        <Surface>
          <FormSection title="Invoice items" description="Enter what you are billing. Description is free text.">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => update("items", [...values.items, { ...emptyItem }])}
              >
                Add item
              </Button>
            </div>
            <div className="space-y-4">
              {values.items.map((item, index) => (
                <div
                  key={`item-${index}`}
                  className="grid gap-3 rounded-[12px] border border-border p-4 md:grid-cols-12"
                >
                  <div className="md:col-span-5">
                    <Field label="Description" htmlFor={`item-desc-${index}`} required>
                      <TextInput
                        id={`item-desc-${index}`}
                        value={item.description}
                        placeholder="Website development"
                        onChange={(event) => updateItem(index, { description: event.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-1">
                    <Field label="Qty" htmlFor={`item-qty-${index}`} required>
                      <TextInput
                        id={`item-qty-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: event.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Unit price" htmlFor={`item-price-${index}`} required>
                      <TextInput
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-1">
                    <Field label="Discount" htmlFor={`item-disc-${index}`}>
                      <TextInput
                        id={`item-disc-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(event) => updateItem(index, { discount: event.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-1">
                    <Field label="Tax %" htmlFor={`item-tax-${index}`} hint="Tax applied to this line.">
                      <TextInput
                        id={`item-tax-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(event) => updateItem(index, { taxRate: event.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="flex items-end md:col-span-1">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        update(
                          "items",
                          values.items.length === 1
                            ? [{ ...emptyItem }]
                            : values.items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm md:ml-auto md:w-80">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(totals.subtotal, values.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd>{formatMoney(totals.discountAmount, values.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd>{formatMoney(totals.taxAmount, values.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total, values.currency)}</dd>
              </div>
            </dl>
          </FormSection>
        </Surface>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <Surface className="space-y-6">
            <FormSection title="Review" description="Confirm the details before you save.">
              <dl className="grid gap-4 sm:grid-cols-2">
                <ReviewItem label="Customer" value={selectedCustomer?.name ?? "—"} />
                <ReviewItem
                  label="Company"
                  value={selectedCustomer?.company || "—"}
                />
                <ReviewItem label="Invoice date" value={values.invoiceDate} />
                <ReviewItem label="Due date" value={values.dueDate} />
                <ReviewItem label="Currency" value={values.currency} />
                <ReviewItem
                  label="Invoice number"
                  value={values.invoiceNumber || "Generated on save"}
                />
              </dl>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs font-medium uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-3">Item</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.items.map((item, index) => (
                      <tr key={`review-${index}`} className="border-t border-border">
                        <td className="py-2 pr-3">{item.description || "—"}</td>
                        <td className="py-2 pr-3 text-muted">{item.quantity}</td>
                        <td className="py-2 text-muted">
                          {item.unitPrice ? formatMoney(item.unitPrice, values.currency) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setAdvancedOpen((open) => !open)}
              >
                {advancedOpen ? "Hide notes and terms" : "Notes and terms (optional)"}
              </button>
              {advancedOpen ? (
                <div className="space-y-4">
                  <Field label="Notes" htmlFor="invoice-notes">
                    <TextArea
                      id="invoice-notes"
                      rows={3}
                      value={values.notes}
                      placeholder="Thank you for your business."
                      onChange={(event) => update("notes", event.target.value)}
                    />
                  </Field>
                  <Field label="Terms" htmlFor="invoice-terms">
                    <TextArea
                      id="invoice-terms"
                      rows={3}
                      value={values.terms}
                      onChange={(event) => update("terms", event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </FormSection>
          </Surface>
          <aside className="rounded-[12px] border border-border bg-surface p-5 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-foreground">Total</h2>
            <p className="mt-1 text-xs text-muted">The saved invoice uses server-calculated amounts.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(totals.subtotal, values.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd>{formatMoney(totals.discountAmount, values.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd>{formatMoney(totals.taxAmount, values.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total, values.currency)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : null}

      {formError || error ? (
        <p className="text-sm text-danger" role="alert">
          {formError ?? error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          {step > 0 ? (
            <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={busy}>
              Back
            </Button>
          ) : (
            <Link href="/invoices">
              <Button variant="ghost">Cancel</Button>
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {step < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => void save()} disabled={busy}>
                {busy ? "Saving…" : "Save draft"}
              </Button>
              <Button onClick={() => void save()} disabled={busy}>
                {busy ? "Saving…" : mode === "create" ? "Create invoice" : "Save invoice"}
              </Button>
            </>
          )}
        </div>
      </div>

      {addCustomerOpen ? (
        <CustomerForm
          title="Add customer"
          mode="create"
          requireOrganization={requireOrganization}
          organizations={organizations}
          busy={customerBusy}
          onClose={() => setAddCustomerOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      ) : null}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function valuesFromInvoice(invoice: Invoice): InvoiceFormValues {
  return {
    customerId: invoice.customerId,
    organizationId: invoice.organizationId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.slice(0, 10),
    dueDate: invoice.dueDate.slice(0, 10),
    currency: invoice.currency,
    notes: invoice.notes ?? "",
    terms: invoice.terms ?? "",
    assignedTeamId: invoice.assignedTeamId ?? "",
    assignedMemberId: invoice.assignedMemberId ?? "",
    items: invoice.items.map((item) => ({
      productId: item.productId ?? "",
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate ?? "",
    })),
  };
}
