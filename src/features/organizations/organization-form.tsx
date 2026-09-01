"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, TextInput } from "@/components/ui/field";
import { organizationFormSchema } from "@/schemas/admin";
import type { OrganizationFormValues } from "@/services/organizations.service";
import type { OrganizationSummary } from "@/types/admin";

interface OrganizationFormProps {
  title: string;
  mode: "create" | "edit";
  initialValues?: Partial<OrganizationFormValues>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: OrganizationFormValues) => Promise<void>;
}

export function OrganizationForm({
  title,
  mode,
  initialValues,
  busy,
  onClose,
  onSubmit,
}: OrganizationFormProps) {
  const [values, setValues] = useState<OrganizationFormValues>({
    name: initialValues?.name ?? "",
    slug: initialValues?.slug ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = organizationFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setError(null);
    await onSubmit(parsed.data);
  }

  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="organization-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create organization" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="organization-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field
          label="Name"
          htmlFor="org-name"
          required
          hint="The company or workspace this billing account belongs to."
        >
          <TextInput
            id="org-name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            placeholder="Acme Ltd"
            required
          />
        </Field>
        <Field
          label="Slug"
          htmlFor="org-slug"
          hint={mode === "create" ? "Leave blank to generate from the name. Used in internal references." : undefined}
        >
          <TextInput
            id="org-slug"
            value={values.slug}
            onChange={(event) =>
              setValues((current) => ({ ...current, slug: event.target.value.toLowerCase() }))
            }
            placeholder="acme-ltd"
          />
        </Field>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export function valuesFromOrganization(organization: OrganizationSummary): OrganizationFormValues {
  return {
    name: organization.name,
    slug: organization.slug,
  };
}
