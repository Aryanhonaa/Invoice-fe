import { apiRequest } from "@/lib/api/client";
import { memberListResultSchema, memberUserSchema } from "@/schemas/member";
import type { MemberFormValues, MemberListResult, MemberUser } from "@/types/member";
import type { AccountStatus } from "@/types/auth";

export async function listMembers(query: {
  search?: string;
  status?: AccountStatus | "";
  organizationId?: string;
  administratorId?: string;
  page?: number;
  pageSize?: number;
}): Promise<MemberListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.administratorId) params.set("administratorId", query.administratorId);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return memberListResultSchema.parse(await apiRequest<MemberListResult>(`/api/members?${params}`));
}

export async function getMember(id: string): Promise<MemberUser> {
  const data = await apiRequest<{ user: MemberUser }>(`/api/members/${id}`);
  return memberUserSchema.parse(data.user);
}

export async function createMember(values: MemberFormValues): Promise<{
  user: MemberUser;
  temporaryPassword: string | null;
}> {
  const data = await apiRequest<{ user: MemberUser; temporaryPassword: string | null }>(
    "/api/members",
    {
      method: "POST",
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        organizationId: values.organizationId || undefined,
        temporaryPassword: values.temporaryPassword || undefined,
        status: values.status,
      }),
    },
  );

  return {
    user: memberUserSchema.parse(data.user),
    temporaryPassword: data.temporaryPassword,
  };
}

export async function updateMember(
  id: string,
  values: Pick<MemberFormValues, "firstName" | "lastName" | "email" | "temporaryPassword">,
): Promise<{ user: MemberUser; temporaryPassword: string | null }> {
  const data = await apiRequest<{ user: MemberUser; temporaryPassword: string | null }>(
    `/api/members/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        temporaryPassword: values.temporaryPassword || undefined,
      }),
    },
  );
  return {
    user: memberUserSchema.parse(data.user),
    temporaryPassword: data.temporaryPassword,
  };
}

export async function resetMemberPassword(id: string): Promise<{ temporaryPassword: string }> {
  const data = await apiRequest<{ temporaryPassword: string }>(`/api/members/${id}/password`, {
    method: "POST",
  });
  return { temporaryPassword: data.temporaryPassword };
}

export async function updateMemberStatus(id: string, status: AccountStatus): Promise<MemberUser> {
  const data = await apiRequest<{ user: MemberUser }>(`/api/members/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return memberUserSchema.parse(data.user);
}
