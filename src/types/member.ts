import type { OrganizationSummary } from "@/types/admin";
import type { AccountStatus, PublicUser } from "@/types/auth";

export interface MemberTeamSummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MemberUser extends PublicUser {
  organization: OrganizationSummary | null;
  teams: MemberTeamSummary[];
}

export interface MemberListResult {
  items: MemberUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MemberFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationId: string;
  temporaryPassword: string;
  status: AccountStatus;
  teamIds: string[];
}
