"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionGroup, EditAction, StatusAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, SelectInput } from "@/components/ui/field";
import { TeamForm } from "@/features/teams/team-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { listMembers } from "@/services/members.service";
import {
  addTeamMember,
  getTeam,
  listTeamMembers,
  removeTeamMember,
  updateTeam,
  updateTeamStatus,
} from "@/services/teams.service";
import type { MemberUser } from "@/types/member";
import type { Team, TeamFormValues } from "@/types/team";

interface TeamDetailPageProps {
  teamId: string;
}

export function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [availableMembers, setAvailableMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberUser | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamData, teamMembers] = await Promise.all([getTeam(teamId), listTeamMembers(teamId)]);
      setTeam(teamData);
      setMembers(teamMembers);
      if (canManage) {
        const pool = await listMembers({
          organizationId: teamData.organizationId,
          status: "ACTIVE",
          pageSize: 50,
        });
        const assigned = new Set(teamMembers.map((member) => member.id));
        setAvailableMembers(pool.items.filter((member) => !assigned.has(member.id)));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load team.");
    } finally {
      setLoading(false);
    }
  }, [canManage, teamId]);

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

  async function handleEdit(values: TeamFormValues) {
    setFormBusy(true);
    try {
      await updateTeam(teamId, values);
      setEditing(false);
      notify("Team updated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update team.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleAssign() {
    if (!assignMemberId) return;
    setAssignBusy(true);
    try {
      await addTeamMember(teamId, assignMemberId);
      setAssignOpen(false);
      setAssignMemberId("");
      notify("Member assigned to team");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to assign member.", "error");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setAssignBusy(true);
    try {
      await removeTeamMember(teamId, removeTarget.id);
      setRemoveTarget(null);
      notify("Member removed from team");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to remove member.", "error");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleStatus() {
    if (!team) return;
    setStatusBusy(true);
    const nextStatus = team.isActive ? "INACTIVE" : "ACTIVE";
    try {
      await updateTeamStatus(team.id, nextStatus);
      setStatusConfirm(false);
      notify(nextStatus === "ACTIVE" ? "Team activated" : "Team deactivated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update team status.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">Loading team…</div>;
  }

  if (error || !team) {
    return (
      <div role="alert" className="rounded-2xl border border-border bg-primary-soft p-6 text-sm text-primary">
        {error ?? "Team not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-muted">
            <Link href="/teams" className="hover:underline">
              Teams
            </Link>
            <span className="mx-2">/</span>
            {team.name}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{team.name}</h2>
          <p className="mt-1 text-sm text-muted">{team.description || "No description"}</p>
        </div>
        {canManage ? (
          <ActionGroup>
            <EditAction size="md" onClick={() => setEditing(true)} />
            <StatusAction
              size="md"
              active={team.isActive}
              onClick={() => setStatusConfirm(true)}
            />
          </ActionGroup>
        ) : null}
      </div>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Status</p>
          <p className="mt-1 text-sm font-medium text-foreground">{team.isActive ? "Active" : "Inactive"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Members</p>
          <p className="mt-1 text-sm font-medium text-foreground">{team.memberCount}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Team members</h3>
          {canManage ? (
            <Button onClick={() => setAssignOpen(true)} disabled={!team.isActive}>
              Assign member
            </Button>
          ) : null}
        </div>
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            No members assigned to this team yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-3 font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {canManage ? (
                        <Link href={`/members/${member.id}`} className="hover:underline">
                          {member.firstName} {member.lastName}
                        </Link>
                      ) : (
                        <>
                          {member.firstName} {member.lastName}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{member.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {member.status === "ACTIVE" ? "Active" : "Inactive"}
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <Button variant="dangerSoft" size="sm" onClick={() => setRemoveTarget(member)}>
                          Remove
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? (
        <TeamForm
          title="Edit team"
          mode="edit"
          initialValues={{
            name: team.name,
            description: team.description ?? "",
            organizationId: team.organizationId,
          }}
          busy={formBusy}
          onClose={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      ) : null}

      {assignOpen ? (
        <Dialog
          title="Assign member"
          onClose={() => setAssignOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignBusy}>
                Cancel
              </Button>
              <Button onClick={() => void handleAssign()} disabled={assignBusy || !assignMemberId}>
                {assignBusy ? "Assigning…" : "Assign"}
              </Button>
            </>
          }
        >
          <Field label="Member" htmlFor="assign-member" required>
            <SelectInput
              id="assign-member"
              value={assignMemberId}
              onChange={(event) => setAssignMemberId(event.target.value)}
              required
            >
              <option value="">Select a member</option>
              {availableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} ({member.email})
                </option>
              ))}
            </SelectInput>
          </Field>
          {availableMembers.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No unassigned active members available.</p>
          ) : null}
        </Dialog>
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          title="Remove member"
          message={`${removeTarget.firstName} ${removeTarget.lastName} will be removed from ${team.name}.`}
          confirmLabel="Remove"
          danger
          busy={assignBusy}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => void handleRemove()}
        />
      ) : null}

      {statusConfirm ? (
        <ConfirmDialog
          title={team.isActive ? "Deactivate team" : "Activate team"}
          message={
            team.isActive
              ? `${team.name} will no longer accept new members.`
              : `${team.name} will become active again.`
          }
          confirmLabel={team.isActive ? "Deactivate" : "Activate"}
          danger={team.isActive}
          busy={statusBusy}
          onCancel={() => setStatusConfirm(false)}
          onConfirm={() => void handleStatus()}
        />
      ) : null}
    </div>
  );
}
