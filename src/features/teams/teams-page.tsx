"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { TeamForm } from "@/features/teams/team-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { createTeam, listTeams, updateTeam, updateTeamStatus } from "@/services/teams.service";
import type { Team, TeamFormValues, TeamListResult } from "@/types/team";

export function TeamsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [result, setResult] = useState<TeamListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "">("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Team | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Team | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const teams = await listTeams({
        search: search || undefined,
        status,
        page,
        pageSize: 10,
      });
      setResult(teams);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

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

  async function handleCreate(values: TeamFormValues) {
    setFormBusy(true);
    try {
      await createTeam(values);
      setFormMode(null);
      notify("Team created.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create team.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: TeamFormValues) {
    if (!editing) return;
    setFormBusy(true);
    try {
      await updateTeam(editing.id, values);
      setFormMode(null);
      setEditing(null);
      notify("Team updated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update team.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleStatus() {
    if (!statusTarget) return;
    setStatusBusy(true);
    const nextStatus = statusTarget.isActive ? "INACTIVE" : "ACTIVE";
    try {
      await updateTeamStatus(statusTarget.id, nextStatus);
      setStatusTarget(null);
      notify(nextStatus === "ACTIVE" ? "Team activated." : "Team deactivated.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update team status.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Organize members into working groups."
        actions={canManage ? <Button onClick={() => setFormMode("create")}>Create team</Button> : undefined}
      />

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <Field label="Search" htmlFor="team-search">
          <TextInput
            id="team-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Team name"
          />
        </Field>
        <Field label="Status" htmlFor="team-status">
          <SelectInput
            id="team-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "ACTIVE" | "INACTIVE" | "");
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
        <p className="text-sm text-muted">Loading teams…</p>
      ) : error ? (
        <ErrorState title="We couldn't load teams." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create a team to start assigning members."
          action={canManage ? <Button onClick={() => setFormMode("create")}>Create team</Button> : null}
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Members</Th>
                <Th>Status</Th>
                {canManage ? <Th className="text-right">Actions</Th> : null}
              </tr>
            </THead>
            <tbody>
              {result.items.map((team) => (
                <tr key={team.id} className="border-t border-border hover:bg-muted-soft">
                  <Td>
                    <Link href={`/teams/${team.id}`} className="font-medium hover:underline">
                      {team.name}
                    </Link>
                  </Td>
                  <Td muted>{team.memberCount}</Td>
                  <Td>
                    <StatusBadge status={team.isActive ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  {canManage ? (
                    <Td className="text-right">
                      <DropdownMenu
                        items={[
                          {
                            label: "Edit",
                            onClick: () => {
                              setEditing(team);
                              setFormMode("edit");
                            },
                          },
                          {
                            label: team.isActive ? "Deactivate" : "Activate",
                            onClick: () => setStatusTarget(team),
                            danger: team.isActive,
                          },
                        ]}
                      />
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {formMode === "create" ? (
        <TeamForm
          title="Create team"
          mode="create"
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <TeamForm
          title="Edit team"
          mode="edit"
          initialValues={{
            name: editing.name,
            description: editing.description ?? "",
            organizationId: editing.organizationId,
          }}
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
          title={statusTarget.isActive ? "Deactivate team" : "Activate team"}
          message={
            statusTarget.isActive
              ? `${statusTarget.name} will no longer be available for assignment.`
              : `${statusTarget.name} will become active again.`
          }
          confirmLabel={statusTarget.isActive ? "Deactivate" : "Activate"}
          danger={statusTarget.isActive}
          busy={statusBusy}
          onCancel={() => setStatusTarget(null)}
          onConfirm={() => void handleStatus()}
        />
      ) : null}
    </div>
  );
}
