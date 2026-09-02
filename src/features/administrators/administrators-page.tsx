"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AdministratorForm,
  valuesFromAdmin,
} from "@/features/administrators/administrator-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  createAdmin,
  listAdmins,
  resetAdminPassword,
  updateAdmin,
  updateAdminStatus,
} from "@/services/admins.service";
import type { AdminFormValues, AdminListResult, AdminUser } from "@/types/admin";
import type { AccountStatus } from "@/types/auth";

export function AdministratorsPage({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();

  const [result, setResult] = useState<AdminListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const admins = await listAdmins({
        search: search || undefined,
        status,
        page,
        pageSize: 10,
      });
      setResult(admins);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load administrators.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

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

  async function handleCreate(values: AdminFormValues) {
    setFormBusy(true);
    try {
      const created = await createAdmin(values);
      setFormMode(null);
      setGeneratedPassword(created.temporaryPassword);
      setGeneratedEmail(created.user.email);
      notify("Administrator added.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create administrator.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: AdminFormValues) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      await updateAdmin(editing.id, values);
      setFormMode(null);
      setEditing(null);
      setSelectedAdmin(null);
      notify("Administrator updated.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update administrator.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleStatusChange() {
    if (!selectedAdmin) {
      return;
    }
    setStatusBusy(true);
    const nextStatus = selectedAdmin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateAdminStatus(selectedAdmin.id, nextStatus);
      notify(nextStatus === "ACTIVE" ? "Administrator activated" : "Administrator deactivated");
      await load();
      setSelectedAdmin(null);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update status.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleResendCredentials() {
    if (!selectedAdmin) {
      return;
    }
    try {
      const result = await resetAdminPassword(selectedAdmin.id);
      setGeneratedPassword(result.temporaryPassword);
      setGeneratedEmail(selectedAdmin.email);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to reset password.", "error");
    }
  }

  if (authLoading || user?.role !== "SUPER_ADMIN") {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          title="Administrators"
          description="Team administrators who manage members, customers, and invoices."
          actions={<Button onClick={() => setFormMode("create")}>Add administrator</Button>}
        />
      )}
      {embedded ? (
        <div className="flex justify-end">
          <Button onClick={() => setFormMode("create")}>Add administrator</Button>
        </div>
      ) : null}

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <Field label="Search" htmlFor="admin-search">
          <TextInput
            id="admin-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
          />
        </Field>
        <Field label="Status" htmlFor="admin-status">
          <SelectInput
            id="admin-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AccountStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectInput>
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" className="w-full">
            Apply filters
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading administrators…</p>
      ) : error ? (
        <ErrorState title="We couldn't load administrators." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title="No administrators yet"
          description="Add an administrator. They will create their own teams and members."
          action={<Button onClick={() => setFormMode("create")}>Add administrator</Button>}
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Teams</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((admin) => (
                <tr
                  key={admin.id}
                  className="cursor-pointer border-t border-border hover:bg-muted-soft"
                  onClick={() => setSelectedAdmin(admin)}
                >
                  <Td>
                    <span className="font-medium">
                      {admin.firstName} {admin.lastName}
                    </span>
                  </Td>
                  <Td muted>{admin.email}</Td>
                  <Td muted>
                    {admin.teams.length > 0
                      ? admin.teams.map((team) => team.name).join(", ")
                      : "—"}
                  </Td>
                  <Td>
                    <StatusBadge status={admin.status} />
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAdmin(admin);
                      }}
                    >
                      View
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {formMode === "create" ? (
        <AdministratorForm
          title="Add administrator"
          mode="create"
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <AdministratorForm
          title="Edit administrator"
          mode="edit"
          initialValues={valuesFromAdmin(editing)}
          busy={formBusy}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
          onSubmit={handleEdit}
        />
      ) : null}

      {selectedAdmin && !formMode ? (
        <Dialog
          title={`${selectedAdmin.firstName} ${selectedAdmin.lastName}`}
          onClose={() => setSelectedAdmin(null)}
          footer={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setSelectedAdmin(null)}
                disabled={formBusy || statusBusy}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => void handleResendCredentials()}
                disabled={formBusy || statusBusy}
              >
                Resend credentials
              </Button>
              <Button
                variant={selectedAdmin.status === "ACTIVE" ? "danger" : "primary"}
                onClick={() => void handleStatusChange()}
                disabled={formBusy || statusBusy}
              >
                {statusBusy ? "Updating…" : selectedAdmin.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                onClick={() => {
                  setEditing(selectedAdmin);
                  setFormMode("edit");
                }}
                disabled={formBusy || statusBusy}
              >
                Edit
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Email</p>
                <p className="text-sm text-foreground">{selectedAdmin.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Teams</p>
                <p className="text-sm text-foreground">
                  {selectedAdmin.teams.length > 0
                    ? selectedAdmin.teams.map((team) => team.name).join(", ")
                    : "None"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <p className="mt-1">
                    <StatusBadge status={selectedAdmin.status} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      ) : null}

      {generatedPassword ? (
        <Dialog
          title="Administrator credentials"
          onClose={() => {
            setGeneratedPassword(null);
            setGeneratedEmail(null);
            setShowPassword(false);
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Share these credentials. The password is not stored in plain text and will not be shown again.
            </p>

            {generatedEmail ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Email / Username</p>
                <div className="flex gap-2">
                  <p className="flex-1 break-all rounded-lg bg-muted-soft px-3 py-2 font-mono text-sm">
                    {generatedEmail}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedEmail);
                      notify("Email copied.");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-1 text-xs font-medium text-muted">Temporary Password</p>
              <div className="flex gap-2">
                <p className="flex-1 break-all rounded-lg bg-muted-soft px-3 py-2 font-mono text-sm">
                  {showPassword ? generatedPassword : "•".repeat(Math.min(generatedPassword?.length ?? 0, 20))}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "View"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    notify("Password copied.");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-2">
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  const text = `Email: ${generatedEmail}\nPassword: ${generatedPassword}`;
                  navigator.clipboard.writeText(text);
                  notify("Credentials copied.");
                }}
              >
                Copy both
              </Button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
