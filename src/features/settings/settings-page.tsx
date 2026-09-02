"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ROLE_LABELS } from "@/config/navigation";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  getOrganizationSettings,
  removeOrganizationLogo,
  uploadOrganizationLogo,
  type OrganizationSettings,
} from "@/services/settings.service";

export function SettingsPage() {
  const { user, loading } = useAuth();
  const { scopeLabel } = useWorkspace();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Super Admin manages company branding; Administrators do not.
  const canManageLogo = user?.role === "SUPER_ADMIN";

  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!canManageLogo) {
      setOrganization(null);
      return;
    }
    setLogoLoading(true);
    setLogoError(null);
    try {
      setOrganization(await getOrganizationSettings());
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : "Unable to load organization settings.");
    } finally {
      setLogoLoading(false);
    }
  }, [canManageLogo]);

  useEffect(() => {
    void loadOrganization();
  }, [loadOrganization]);

  async function handleUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    setLogoBusy(true);
    try {
      const updated = await uploadOrganizationLogo(file);
      setOrganization(updated);
      notify("Logo updated successfully");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to upload logo.", "error");
    } finally {
      setLogoBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    setLogoBusy(true);
    try {
      const updated = await removeOrganizationLogo();
      setOrganization(updated);
      notify("Logo removed");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to remove logo.", "error");
    } finally {
      setLogoBusy(false);
    }
  }

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
            : "Your account and company settings."
        }
      />

      {canManageLogo ? (
        <section className="rounded-2xl border border-border bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">General</h2>
          <p className="mt-1 text-sm text-muted">
            Organization branding used on invoices, PDFs, emails, and the customer invoice page.
          </p>

          <div className="mt-5">
            <h3 className="text-sm font-medium text-foreground">Organization Logo</h3>
            <p className="mt-1 text-xs text-muted">Recommended: PNG, JPG, SVG or WebP · max 2MB</p>

            {logoLoading ? (
              <p className="mt-4 text-sm text-muted">Loading logo…</p>
            ) : logoError ? (
              <p className="mt-4 text-sm text-red-700">{logoError}</p>
            ) : (
              <>
                <div className="mt-4 flex h-40 w-full max-w-md items-center justify-center rounded-xl border border-dashed border-border bg-muted-soft/40 p-4">
                  {organization?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={organization.logoUrl}
                      alt={`${organization.name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-sm text-muted">No logo uploaded</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(event) => void handleUpload(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    disabled={logoBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {organization?.hasLogo ? "Upload New Logo" : "Upload Logo"}
                  </Button>
                  {organization?.hasLogo ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={logoBusy}
                      onClick={() => void handleRemove()}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

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
              <dd className="mt-1 text-sm">{scopeLabel}</dd>
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
