import { apiRequest } from "@/lib/api/client";
import { organizationSummarySchema } from "@/schemas/admin";
import type { OrganizationSummary } from "@/types/admin";
import { z } from "zod";

const organizationsPayloadSchema = z.object({
  organizations: z.array(organizationSummarySchema),
});

const organizationPayloadSchema = z.object({
  organization: organizationSummarySchema,
});

export interface OrganizationFormValues {
  name: string;
  slug: string;
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const data = await apiRequest<{ organizations: OrganizationSummary[] }>("/api/organizations");
  return organizationsPayloadSchema.parse(data).organizations;
}

export async function getOrganization(id: string): Promise<OrganizationSummary> {
  const data = await apiRequest<{ organization: OrganizationSummary }>(`/api/organizations/${id}`);
  return organizationPayloadSchema.parse(data).organization;
}

export async function createOrganization(values: OrganizationFormValues): Promise<OrganizationSummary> {
  const data = await apiRequest<{ organization: OrganizationSummary }>("/api/organizations", {
    method: "POST",
    body: JSON.stringify({
      name: values.name,
      slug: values.slug.trim() || undefined,
    }),
  });
  return organizationPayloadSchema.parse(data).organization;
}

export async function updateOrganization(
  id: string,
  values: OrganizationFormValues,
): Promise<OrganizationSummary> {
  const data = await apiRequest<{ organization: OrganizationSummary }>(`/api/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: values.name,
      slug: values.slug.trim() || undefined,
    }),
  });
  return organizationPayloadSchema.parse(data).organization;
}

export async function updateOrganizationStatus(
  id: string,
  isActive: boolean,
): Promise<OrganizationSummary> {
  const data = await apiRequest<{ organization: OrganizationSummary }>(
    `/api/organizations/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
  );
  return organizationPayloadSchema.parse(data).organization;
}
