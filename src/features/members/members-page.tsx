"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { MemberForm, valuesFromMember } from "@/features/members/member-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  createMember,
  listMembers,
  updateMember,
  updateMemberStatus,
} from "@/services/members.service";
import type { AccountStatus } from "@/types/auth";
import type { MemberFormValues, MemberListResult, MemberUser } from "@/types/member";

export function MembersPage({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { organizationId, teamId: workspaceTeamId, tenantListsReady, scopeLabel } =
    useWorkspace();
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [result, setResult] = useState<MemberListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<MemberUser | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<MemberUser | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSuperAdmin && !tenantListsReady) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const members = await listMembers({
        search: search || undefined,
        status,
        organizationId: isSuperAdmin ? undefined : organizationId || undefined,
        teamId: isSuperAdmin ? undefined : workspaceTeamId || undefined,
        page,
        pageSize: 10,
      });
      setResult(members);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, [
    isSuperAdmin,
    organizationId,
    page,
    search,
    status,
    tenantListsReady,
    workspaceTeamId,
  ]);

  useEffect(() => {
    if (!authLoading && !canManage) {
      router.replace("/");
    }
  }, [authLoading, canManage, router]);

  useEffect(() => {
    if (!canManage) {
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
  }, [canManage, load]);

  async function handleCreate(values: MemberFormValues) {
    setFormBusy(true);
    try {
      const created = await createMember(values);
      setFormMode(null);
      setGeneratedPassword(created.temporaryPassword);
      notify("Member added.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create member.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: MemberFormValues) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      await updateMember(editing.id, values);
      setFormMode(null);
      setEditing(null);
      notify("Member updated.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update member.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) {
      return;
    }
    setStatusBusy(true);
    const nextStatus = statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMemberStatus(statusTarget.id, nextStatus);
      setStatusTarget(null);
      notify(nextStatus === "ACTIVE" ? "Member activated" : "Member deactivated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update status.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  if (authLoading || !canManage) {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <PageHeader
          title="Members"
          description={`People who can create and work on invoices. ${scopeLabel}.`}
          actions={<Button onClick={() => setFormMode("create")}>Add member</Button>}
        />
      ) : (
        <div className="flex justify-end">
          <Button onClick={() => setFormMode("create")}>Add member</Button>
        </div>
      )}

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <Field label="Search" htmlFor="member-search">
          <TextInput
            id="member-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members by name or email"
          />
        </Field>
        <Field label="Status" htmlFor="member-status-filter">
          <SelectInput
            id="member-status-filter"
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
        <p className="text-sm text-muted">Loading members…</p>
      ) : error ? (
        <ErrorState title="We couldn't load members." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Add a member so they can work with invoices."
          action={<Button onClick={() => setFormMode("create")}>Add member</Button>}
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
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((member) => (
                <tr key={member.id} className="border-t border-border hover:bg-muted-soft">
                  <Td>
                    <Link href={`/members/${member.id}`} className="font-medium hover:underline">
                      {member.firstName} {member.lastName}
                    </Link>
                    <p className="text-xs text-muted">
                      {member.teams.length > 0
                        ? `${member.teams.length} team${member.teams.length === 1 ? "" : "s"}`
                        : "No teams"}
                    </p>
                  </Td>
                  <Td muted>{member.email}</Td>
                  <Td>
                    <StatusBadge status={member.status} />
                  </Td>
                  <Td className="text-right">
                    <DropdownMenu
                      items={[
                        {
                          label: "Edit",
                          onClick: () => {
                            setEditing(member);
                            setFormMode("edit");
                          },
                        },
                        {
                          label: member.status === "ACTIVE" ? "Deactivate" : "Activate",
                          onClick: () => setStatusTarget(member),
                          danger: member.status === "ACTIVE",
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
        <MemberForm
          title="Add member"
          mode="create"
          initialValues={{ organizationId: organizationId ?? "" }}
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <MemberForm
          title="Edit member"
          mode="edit"
          initialValues={valuesFromMember(editing)}
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
          title={statusTarget.status === "ACTIVE" ? "Deactivate this member?" : "Activate this member?"}
          message={
            statusTarget.status === "ACTIVE"
              ? `${statusTarget.firstName} ${statusTarget.lastName} will no longer be able to sign in.`
              : `${statusTarget.firstName} ${statusTarget.lastName} will be able to sign in again.`
          }
          confirmLabel={statusTarget.status === "ACTIVE" ? "Deactivate" : "Activate"}
          danger={statusTarget.status === "ACTIVE"}
          busy={statusBusy}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleStatusChange()}
        />
      ) : null}

      {generatedPassword ? (
        <Dialog title="Temporary password" onClose={() => setGeneratedPassword(null)}>
          <p className="text-sm text-muted">
            Share this password now. It is not stored in plain text and will not be shown again.
          </p>
          <p className="mt-4 rounded-lg bg-muted-soft px-3 py-2 font-mono text-sm break-all">
            {generatedPassword}
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}
