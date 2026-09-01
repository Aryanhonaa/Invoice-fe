import { OrganizationDetailPage } from "@/features/organizations/organization-detail-page";

export default async function OrganizationDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizationDetailPage organizationId={id} />;
}
