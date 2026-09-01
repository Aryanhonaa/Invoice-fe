"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { createAdminFormSchema } from "@/schemas/admin";
import type { AdminFormValues, AdminUser } from "@/types/admin";
import type { Team } from "@/types/team";

interface AdministratorFormProps {
  title: string;
  teamId?: string;
  teamName?: string;
  initialValues?: Partial<AdminFormValues>;
  mode: "create" | "edit";
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => Promise<void>;
  teams?: Team[];
}

const emptyValues: AdminFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organizationId: "",
  teamId: "",
  temporaryPassword: "",
  status: "ACTIVE",
};

export function AdministratorForm({
  title,
  teamId,
  teamName,
  teams = [],
  initialValues,
  mode,
  busy,
  onClose,
  onSubmit,
}: AdministratorFormProps) {
  const [values, setValues] = useState<AdminFormValues>({
    ...emptyValues,
    ...initialValues,
    teamId: teamId ?? initialValues?.teamId ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AdminFormValues, string>>>({});

  function update<K extends keyof AdminFormValues>(key: K, value: AdminFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "create") {
      const parsed = createAdminFormSchema.safeParse({ ...values, teamId: values.teamId || teamId });
      if (!parsed.success) {
        const nextErrors: Partial<Record<keyof AdminFormValues, string>> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string") {
            nextErrors[key as keyof AdminFormValues] = issue.message;
          }
        }
        setErrors(nextErrors);
        return;
      }
      setErrors({});
      await onSubmit({ ...parsed.data, teamId: parsed.data.teamId } as AdminFormValues);
      return;
    }

    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setErrors({ email: "All fields are required." });
      return;
    }
    setErrors({});
    await onSubmit(values);
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
          <Button type="submit" form="administrator-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create administrator" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="administrator-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        {mode === "create" && !teamName ? (
          <Field label="Team" htmlFor="admin-team" error={errors.teamId} required>
            <SelectInput
              id="admin-team"
              value={values.teamId}
              onChange={(event) => update("teamId", event.target.value)}
              required
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : teamName ? (
          <p className="text-sm text-muted">
            Team: <span className="font-medium text-foreground">{teamName}</span>
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
            <TextInput
              id="firstName"
              value={values.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
            <TextInput
              id="lastName"
              value={values.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </Field>
        </div>
        <Field
          label="Email / username"
          htmlFor="email"
          error={errors.email}
          required
          hint="This is the login username."
        >
          <TextInput
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </Field>
        {mode === "create" ? (
          <p className="text-xs text-muted">
            A temporary password is generated automatically and shown once after you save.
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export function valuesFromAdmin(admin: AdminUser): AdminFormValues {
  return {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: "",
    organizationId: admin.organizationId ?? "",
    teamId: "",
    temporaryPassword: "",
    status: admin.status,
  };
}
