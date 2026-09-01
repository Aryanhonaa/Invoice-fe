export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MEMBER";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  organizationId: string | null;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
