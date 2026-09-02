"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, TextInput } from "@/components/ui/field";
import { teamFormSchema } from "@/schemas/team";
import type { TeamFormValues } from "@/types/team";

interface TeamFormProps {
  title: string;
  mode: "create" | "edit";
  initialValues?: Partial<TeamFormValues>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: TeamFormValues) => Promise<void>;
}

export function TeamForm({
  title,
  mode,
  initialValues,
  busy,
  onClose,
  onSubmit,
}: TeamFormProps) {
  const [values, setValues] = useState<TeamFormValues>({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = teamFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setError(null);
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
          <Button type="submit" form="team-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create team" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="team-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Name" htmlFor="team-name" required>
          <TextInput
            id="team-name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </Field>
        <Field label="Description" htmlFor="team-description">
          <TextInput
            id="team-description"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
          />
        </Field>
        {error ? (
          <p className="text-sm text-primary" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
