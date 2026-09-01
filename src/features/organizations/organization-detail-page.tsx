"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { listCustomers } from "@/services/customers.service";
import { listMembers } from "@/services/members.service";
import { getOrganization } from "@/services/organizations.service";
import { listTeams } from "@/services/teams.service";
import type { OrganizationSummary } from "@/types/admin";
import type { Customer } from "@/types/catalog";
import type { MemberUser } from "@/types/member";
import type { Team } from "@/types/team";

type TabId = "overview" | "admin" | "teams" | "members" | "customers" | "activity";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "admin", label: "Admin" },
  { id: "teams", label: "Teams" },
  { id: "members", label: "Members" },
  { id: "customers", label: "Customers" },
  { id: "activity", label: "Activity" },
];

export function OrganizationDetailPage({ organizationId }: { organizationId: string }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [org, teamResult, memberResult, customerResult] = await Promise.all([
        getOrganization(organizationId),
        listTeams({ organizationId, pageSize: 50 }),
        listMembers({ organizationId, pageSize: 50 }),
        listCustomers({ organizationId, pageSize: 50 }),
      ]);
      setOrganization(org);
      setTeams(teamResult.items);
      setMembers(memberResult.items);
      setCustomers(customerResult.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load this organization.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

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

  if (user && user.role !== "SUPER_ADMIN") {
    return (
      <ErrorState
        title="Platform administrators only"
        message="Organization overviews are available to Super Admin."
      />
    );
  }

  if (loading && !organization) {
    return <p className="text-sm text-muted">Loading organization…</p>;
  }

  if (error || !organization) {
    return (
      <ErrorState
        title="We couldn't load this organization."
        message={error}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.name}
        description="Administrative overview. This is not the organization's billing workspace."
        actions={
          <Link href="/organizations">
            <Button variant="secondary">Back to organizations</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              tab === item.id
                ? "rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-primary"
                : "rounded-full px-3 py-1 text-sm text-muted hover:bg-slate-50"
            }
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <OverviewCard label="Status" value={organization.isActive ? "Active" : "Inactive"} />
          <OverviewCard label="Slug" value={organization.slug} />
          <OverviewCard label="Created" value={organization.createdAt?.slice(0, 10) ?? "—"} />
          <OverviewCard label="Admins" value={String(organization.adminCount ?? 0)} />
          <OverviewCard label="Members" value={String(organization.memberCount ?? members.length)} />
          <OverviewCard label="Teams" value={String(organization.teamCount ?? teams.length)} />
          <OverviewCard label="Customers" value={String(organization.customerCount ?? customers.length)} />
          <OverviewCard label="Invoices" value={String(organization.invoiceCount ?? 0)} />
        </div>
      ) : null}

      {tab === "admin" ? (
        organization.admin ? (
          <section className="rounded-[12px] border border-border bg-surface px-5 py-4">
            <p className="text-sm font-medium text-foreground">
              {organization.admin.firstName} {organization.admin.lastName}
            </p>
            <p className="mt-1 text-sm text-muted">{organization.admin.email}</p>
            <Link href="/users" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Manage administrators
            </Link>
          </section>
        ) : (
          <EmptyState
            title="No organization admin"
            description="Create an administrator from Admins & Users and assign this organization."
            action={
              <Link href="/users">
                <Button>Admins & Users</Button>
              </Link>
            }
          />
        )
      ) : null}

      {tab === "teams" ? (
        teams.length === 0 ? (
          <EmptyState title="No teams" description="This organization has not created any teams yet." />
        ) : (
          <DataTable>
            <Table>
              <THead>
                <tr>
                  <Th>Team</Th>
                  <Th>Members</Th>
                  <Th>Status</Th>
                </tr>
              </THead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-t border-slate-100">
                    <Td>
                      <span className="font-medium">{team.name}</span>
                      {team.description ? <p className="text-xs text-muted">{team.description}</p> : null}
                    </Td>
                    <Td muted>{team.memberCount}</Td>
                    <Td>
                      <StatusBadge status={team.isActive ? "ACTIVE" : "INACTIVE"} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataTable>
        )
      ) : null}

      {tab === "members" ? (
        members.length === 0 ? (
          <EmptyState title="No members" description="No MEMBER accounts belong to this organization." />
        ) : (
          <DataTable>
            <Table>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Teams</Th>
                  <Th>Status</Th>
                </tr>
              </THead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-slate-100">
                    <Td>
                      <Link href={`/members/${member.id}`} className="font-medium hover:underline">
                        {member.firstName} {member.lastName}
                      </Link>
                    </Td>
                    <Td muted>{member.email}</Td>
                    <Td muted>
                      {member.teams.length > 0 ? member.teams.map((team) => team.name).join(", ") : "None"}
                    </Td>
                    <Td>
                      <StatusBadge status={member.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataTable>
        )
      ) : null}

      {tab === "customers" ? (
        customers.length === 0 ? (
          <EmptyState title="No customers" description="This organization has no customer records." />
        ) : (
          <DataTable>
            <Table>
              <THead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                </tr>
              </THead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-slate-100">
                    <Td>
                      <span className="font-medium">{customer.name}</span>
                      {customer.company ? <p className="text-xs text-muted">{customer.company}</p> : null}
                    </Td>
                    <Td muted>{customer.email ?? "—"}</Td>
                    <Td>
                      <StatusBadge status={customer.isActive ? "ACTIVE" : "INACTIVE"} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataTable>
        )
      ) : null}

      {tab === "activity" ? (
        <section className="rounded-[12px] border border-border bg-surface px-5 py-4">
          <p className="text-sm text-muted">
            Created {organization.createdAt?.slice(0, 10) ?? "—"}. There is no published audit timeline for
            Super Admin. Invoice volume is {organization.invoiceCount ?? 0} (all time). Organization
            collections are not shown here.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
