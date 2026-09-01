"use client";

import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SuperAdminGuard } from "@/components/layout/super-admin-guard";
import { useRequireAuth } from "@/providers/auth-provider";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { loading, user } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <WorkspaceProvider>
        <SuperAdminGuard>
          <AppShell>{children}</AppShell>
        </SuperAdminGuard>
      </WorkspaceProvider>
    </Suspense>
  );
}
