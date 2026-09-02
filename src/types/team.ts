import type { OrganizationSummary } from "@/types/admin";

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
  organization: OrganizationSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamListResult {
  items: Team[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TeamFormValues {
  name: string;
  description: string;
}
