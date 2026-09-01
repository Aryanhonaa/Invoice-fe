import { apiRequest } from "@/lib/api/client";
import { memberUserSchema } from "@/schemas/member";
import { teamListResultSchema, teamSchema } from "@/schemas/team";
import type { MemberUser } from "@/types/member";
import type { Team, TeamFormValues, TeamListResult } from "@/types/team";
import { z } from "zod";

export async function listTeams(query: {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "";
  organizationId?: string;
  page?: number;
  pageSize?: number;
}): Promise<TeamListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return teamListResultSchema.parse(await apiRequest<TeamListResult>(`/api/teams?${params}`));
}

export async function getTeam(id: string): Promise<Team> {
  const data = await apiRequest<{ team: Team }>(`/api/teams/${id}`);
  return teamSchema.parse(data.team);
}

export async function createTeam(values: TeamFormValues): Promise<Team> {
  const data = await apiRequest<{ team: Team }>("/api/teams", {
    method: "POST",
    body: JSON.stringify({
      name: values.name,
      description: values.description || undefined,
      organizationId: values.organizationId || undefined,
    }),
  });
  return teamSchema.parse(data.team);
}

export async function updateTeam(
  id: string,
  values: Pick<TeamFormValues, "name" | "description">,
): Promise<Team> {
  const data = await apiRequest<{ team: Team }>(`/api/teams/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: values.name,
      description: values.description || null,
    }),
  });
  return teamSchema.parse(data.team);
}

export async function updateTeamStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<Team> {
  const data = await apiRequest<{ team: Team }>(`/api/teams/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return teamSchema.parse(data.team);
}

export async function listTeamMembers(teamId: string): Promise<MemberUser[]> {
  const data = await apiRequest<{ members: MemberUser[] }>(`/api/teams/${teamId}/members`);
  return z.array(memberUserSchema).parse(data.members);
}

export async function addTeamMember(teamId: string, memberId: string): Promise<MemberUser> {
  const data = await apiRequest<{ member: MemberUser }>(`/api/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
  return memberUserSchema.parse(data.member);
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  await apiRequest<{ removed: boolean }>(`/api/teams/${teamId}/members/${memberId}`, {
    method: "DELETE",
  });
}
