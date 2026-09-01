import { TeamDetailPage } from "@/features/teams/team-detail-page";

export default async function TeamDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamDetailPage teamId={id} />;
}
