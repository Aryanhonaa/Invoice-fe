"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { ApiError } from "@/lib/api/types";
import { memberFormSchema } from "@/schemas/member";
import { listTeams } from "@/services/teams.service";
import type { MemberFormValues, MemberUser } from "@/types/member";
import type { Team } from "@/types/team";

interface MemberFormProps {
  title: string;
  mode: "create" | "edit";
  initialValues?: Partial<MemberFormValues>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => Promise<void>;
}

const emptyValues: MemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organizationId: "",
  temporaryPassword: "",
  status: "ACTIVE",
  teamIds: [],
};

export function MemberForm({
  title,
  mode,
  initialValues,
  busy,
  onClose,
  onSubmit,
}: MemberFormProps) {
  const [values, setValues] = useState<MemberFormValues>({
    ...emptyValues,
    ...initialValues,
    teamIds: initialValues?.teamIds ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setTeamsLoading(true);
        try {
          const result = await listTeams({
            status: "ACTIVE",
            pageSize: 50,
          });
          if (!cancelled) {
            setTeams(result.items);
          }
        } catch (err) {
          if (!cancelled) {
            setFormError(err instanceof ApiError ? err.message : "Unable to load teams.");
          }
        } finally {
          if (!cancelled) {
            setTeamsLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode]);

  function update<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleTeam(teamId: string) {
    setValues((current) => ({
      ...current,
      teamIds: current.teamIds.includes(teamId)
        ? current.teamIds.filter((id) => id !== teamId)
        : [...current.teamIds, teamId],
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = memberFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof MemberFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          nextErrors[key as keyof MemberFormValues] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    await onSubmit({
      ...parsed.data,
      phone: parsed.data.phone ?? "",
      organizationId: values.organizationId,
      teamIds: values.teamIds,
    });
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
          <Button type="submit" form="member-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create member" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="member-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="member-firstName" error={errors.firstName} required>
            <TextInput
              id="member-firstName"
              value={values.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="member-lastName" error={errors.lastName} required>
            <TextInput
              id="member-lastName"
              value={values.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="member-email" error={errors.email} required>
          <TextInput
            id="member-email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </Field>
        <Field label="Phone" htmlFor="member-phone" error={errors.phone}>
          <TextInput
            id="member-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
        {mode === "create" ? (
          <>
            <Field
              label="Temporary password"
              htmlFor="member-password"
              error={errors.temporaryPassword}
            >
              <TextInput
                id="member-password"
                type="password"
                autoComplete="new-password"
                value={values.temporaryPassword}
                onChange={(event) => update("temporaryPassword", event.target.value)}
              />
            </Field>
            <p className="text-xs text-muted">
              Leave blank to generate a secure temporary password. It will be shown once.
            </p>
            <Field label="Status" htmlFor="member-status" error={errors.status}>
              <SelectInput
                id="member-status"
                value={values.status}
                onChange={(event) =>
                  update("status", event.target.value as MemberFormValues["status"])
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </SelectInput>
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Assign to teams</legend>
              {teamsLoading ? (
                <p className="text-sm text-muted">Loading teams…</p>
              ) : teams.length === 0 ? (
                <p className="text-sm text-muted">No active teams available.</p>
              ) : (
                <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-border p-3">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={values.teamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </>
        ) : null}
        {formError ? (
          <p className="text-sm text-primary" role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export function valuesFromMember(member: MemberUser): MemberFormValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone ?? "",
    organizationId: member.organizationId ?? "",
    temporaryPassword: "",
    status: member.status,
    teamIds: member.teams.map((team) => team.id),
  };
}
