"use client";

import { PageHeader } from "@/components/ui/page-header";
import { ROLE_LABELS } from "@/config/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspace } from "@/providers/workspace-provider";

export function SettingsPage() {
  const { user, loading } = useAuth();
  const { scopeLabel } = useWorkspace();

  if (loading || !user) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description={
          user.role === "SUPER_ADMIN"
            ? "Your account in this internal billing workspace."
            : "Your account and current workspace."
        }
      />
      <section className="rounded-2xl border border-border bg-surface px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Account</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 text-sm">
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Role</dt>
            <dd className="mt-1 text-sm">{ROLE_LABELS[user.role]}</dd>
          </div>
          {user.role !== "SUPER_ADMIN" ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Workspace</dt>
              <dd className="mt-1 text-sm">
              <dd className="mt-1 text-sm">{scopeLabel}</dd>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
      {user.role === "SUPER_ADMIN" ? (
        <section className="rounded-2xl border border-border bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Platform</h2>
          <p className="mt-2 text-sm text-muted">
            This is an internal company billing workspace. Teams and administrators are managed from
            those pages.
          </p>
        </section>
      ) : null}
    </div>
  );
}
