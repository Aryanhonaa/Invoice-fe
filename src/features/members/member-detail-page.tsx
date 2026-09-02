"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionGroup, EditAction, StatusAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, SelectInput } from "@/components/ui/field";
import { MemberForm, valuesFromMember } from "@/features/members/member-form";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { getMember, updateMember, updateMemberStatus } from "@/services/members.service";
import { addTeamMember, listTeams, removeTeamMember } from "@/services/teams.service";
import type { MemberFormValues, MemberTeamSummary, MemberUser } from "@/types/member";
import type { Team } from "@/types/team";

interface MemberDetailPageProps {
  memberId: string;
}

export function MemberDetailPage({ memberId }: MemberDetailPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const canAssignTeams = user?.role === "ADMIN";

  const [member, setMember] = useState<MemberUser | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MemberTeamSummary | null>(null);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const memberData = await getMember(memberId);
      setMember(memberData);
      const assigned = new Set(memberData.teams.map((team) => team.id));
      const teamResult = await listTeams({
        organizationId: memberData.organizationId ?? undefined,
        status: "ACTIVE",
        pageSize: 50,
      });
      setAvailableTeams(teamResult.items.filter((team) => !assigned.has(team.id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load member.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

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

  async function handleEdit(values: MemberFormValues) {
    setFormBusy(true);
    try {
      await updateMember(memberId, values);
      setEditing(false);
      notify("Member updated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update member.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleAssign() {
    if (!assignTeamId) {
      return;
    }
    setAssignBusy(true);
    try {
      await addTeamMember(assignTeamId, memberId);
      setAssignOpen(false);
      setAssignTeamId("");
      notify("Member assigned to team");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to assign member.", "error");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) {
      return;
    }
    setAssignBusy(true);
    try {
      await removeTeamMember(removeTarget.id, memberId);
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
    if (!member) {
      return;
    }
    setStatusBusy(true);
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMemberStatus(member.id, nextStatus);
      setStatusConfirm(false);
      notify(nextStatus === "ACTIVE" ? "Member activated" : "Member deactivated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update member status.", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  if (authLoading || !canManage) {
    return <p className="text-sm text-muted">Checking access…</p>;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
        Loading member…
      </div>
    );
  }

  if (error || !member) {
    return (
      <div role="alert" className="rounded-2xl border border-border bg-primary-soft p-6 text-sm text-primary">
        {error ?? "Member not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-muted">
            <Link href="/members" className="hover:underline">
              Members
            </Link>
            <span className="mx-2">/</span>
            {member.firstName} {member.lastName}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {member.firstName} {member.lastName}
          </h2>
          <p className="mt-1 text-sm text-muted">{member.email}</p>
        </div>
        <ActionGroup>
          <EditAction size="md" onClick={() => setEditing(true)} />
          <StatusAction
            size="md"
            active={member.status === "ACTIVE"}
            onClick={() => setStatusConfirm(true)}
          />
        </ActionGroup>
      </div>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Status</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {member.status === "ACTIVE" ? "Active" : "Inactive"}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Teams</h3>
          {canAssignTeams ? (
            <Button onClick={() => setAssignOpen(true)} disabled={member.status !== "ACTIVE"}>
              Assign to team
            </Button>
          ) : null}
        </div>
        {member.teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            This member is not assigned to any team.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {member.teams.map((team) => (
                  <tr key={team.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/teams/${team.id}`} className="hover:underline">
                        {team.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {team.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3">
                      {canAssignTeams ? (
                        <Button variant="dangerSoft" size="sm" onClick={() => setRemoveTarget(team)}>
                          Remove
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? (
        <MemberForm
          title="Edit member"
          mode="edit"
          initialValues={valuesFromMember(member)}
          busy={formBusy}
          onClose={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      ) : null}

      {assignOpen ? (
        <Dialog
          title="Assign to team"
          onClose={() => setAssignOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignBusy}>
                Cancel
              </Button>
              <Button onClick={() => void handleAssign()} disabled={assignBusy || !assignTeamId}>
                {assignBusy ? "Assigning…" : "Assign"}
              </Button>
            </>
          }
        >
          <Field label="Team" htmlFor="assign-team" required>
            <SelectInput
              id="assign-team"
              value={assignTeamId}
              onChange={(event) => setAssignTeamId(event.target.value)}
              required
            >
              <option value="">Select a team</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          {availableTeams.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No unassigned active teams remain.</p>
          ) : null}
        </Dialog>
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          title="Remove from team"
          message={`${member.firstName} ${member.lastName} will be removed from ${removeTarget.name}.`}
          confirmLabel="Remove"
          danger
          busy={assignBusy}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => void handleRemove()}
        />
      ) : null}

      {statusConfirm ? (
        <ConfirmDialog
          title={member.status === "ACTIVE" ? "Deactivate member" : "Activate member"}
          message={
            member.status === "ACTIVE"
              ? `${member.firstName} ${member.lastName} will no longer be able to sign in.`
              : `${member.firstName} ${member.lastName} will be able to sign in again.`
          }
          confirmLabel={member.status === "ACTIVE" ? "Deactivate" : "Activate"}
          danger={member.status === "ACTIVE"}
          busy={statusBusy}
          onCancel={() => setStatusConfirm(false)}
          onConfirm={() => void handleStatus()}
        />
      ) : null}
    </div>
  );
}
