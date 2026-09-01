"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  OrganizationForm,
  valuesFromOrganization,
} from "@/features/organizations/organization-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  createOrganization,
  listOrganizations,
  updateOrganization,
  updateOrganizationStatus,
  type OrganizationFormValues,
} from "@/services/organizations.service";
import type { OrganizationSummary } from "@/types/admin";

export function OrganizationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();

  const [items, setItems] = useState<OrganizationSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "">("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<OrganizationSummary | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<OrganizationSummary | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listOrganizations());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role !== "SUPER_ADMIN") {
      router.replace("/");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      return;
    }
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
  }, [load, user?.role]);

  async function handleCreate(values: OrganizationFormValues) {
    setFormBusy(true);
    try {
      await createOrganization(values);
      setFormMode(null);
      notify("Organization created successfully.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "We couldn't create this organization.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: OrganizationFormValues) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      await updateOrganization(editing.id, values);
      setFormMode(null);
      setEditing(null);
      notify("Organization updated successfully.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "We couldn't update this organization.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) {
      return;
    }
    setStatusBusy(true);
    const nextActive = !statusTarget.isActive;
    try {
      await updateOrganizationStatus(statusTarget.id, nextActive);
      setStatusTarget(null);
      notify(nextActive ? "Organization activated." : "Organization deactivated.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "We couldn't update this organization.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  if (authLoading || user?.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  const query = search.trim().toLowerCase();
  const visible = (items ?? []).filter((organization) => {
    if (status === "ACTIVE" && !organization.isActive) {
      return false;
    }
    if (status === "INACTIVE" && organization.isActive) {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      organization.name.toLowerCase().includes(query) || organization.slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Each organization is a separate billing workspace. Create one, then add an administrator for it."
        actions={<Button onClick={() => setFormMode("create")}>Create organization</Button>}
      />

      <form
        className="grid gap-3 rounded-[12px] border border-border bg-surface p-4 md:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field label="Search" htmlFor="org-search">
          <TextInput
            id="org-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or slug"
          />
        </Field>
        <Field label="Status" htmlFor="org-status">
          <SelectInput
            id="org-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE" | "")}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectInput>
        </Field>
      </form>

      {loading && !items ? (
        <TableSkeleton cols={3} />
      ) : error && !items ? (
        <ErrorState title="We couldn't load organizations." message={error} onRetry={() => void load()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={items && items.length > 0 ? "No organizations match these filters" : "No organizations yet"}
          description={
            items && items.length > 0
              ? "Try a different search or clear the filters."
              : "Create an organization so you can add an administrator and start invoicing."
          }
          action={
            !items?.length ? (
              <Button onClick={() => setFormMode("create")}>Create organization</Button>
            ) : null
          }
        />
      ) : (
        <DataTable>
          <Table>
            <THead>
              <tr>
                <Th>Organization</Th>
                <Th>Admin</Th>
                <Th>Members</Th>
                <Th>Teams</Th>
                <Th>Customers</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {visible.map((organization) => (
                <tr key={organization.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <Td>
                    <Link href={`/organizations/${organization.id}`} className="font-medium hover:underline">
                      {organization.name}
                    </Link>
                    <p className="text-xs text-muted">{organization.slug}</p>
                  </Td>
                  <Td muted>
                    {organization.admin
                      ? `${organization.admin.firstName} ${organization.admin.lastName}`
                      : "None"}
                  </Td>
                  <Td muted>{organization.memberCount ?? "—"}</Td>
                  <Td muted>{organization.teamCount ?? "—"}</Td>
                  <Td muted>{organization.customerCount ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={organization.isActive ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td muted>{organization.createdAt ? organization.createdAt.slice(0, 10) : "—"}</Td>
                  <Td className="text-right">
                    <DropdownMenu
                      items={[
                        {
                          label: "View",
                          onClick: () => router.push(`/organizations/${organization.id}`),
                        },
                        {
                          label: "Edit",
                          onClick: () => {
                            setEditing(organization);
                            setFormMode("edit");
                          },
                        },
                        {
                          label: organization.isActive ? "Deactivate" : "Activate",
                          onClick: () => setStatusTarget(organization),
                          danger: organization.isActive,
                        },
                      ]}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {formMode === "create" ? (
        <OrganizationForm
          title="Create organization"
          mode="create"
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <OrganizationForm
          title="Edit organization"
          mode="edit"
          initialValues={valuesFromOrganization(editing)}
          busy={formBusy}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
          onSubmit={handleEdit}
        />
      ) : null}

      {statusTarget ? (
        <ConfirmDialog
          title={statusTarget.isActive ? "Deactivate this organization?" : "Activate this organization?"}
          message={
            statusTarget.isActive
              ? `${statusTarget.name} will be unavailable. Its administrators and members will not be able to sign in.`
              : `${statusTarget.name} will be available again.`
          }
          confirmLabel={statusTarget.isActive ? "Deactivate" : "Activate"}
          danger={statusTarget.isActive}
          busy={statusBusy}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleStatusChange()}
        />
      ) : null}
    </div>
  );
}
