"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";

export function WorkspaceSwitcher() {
  const { user } = useAuth();
  const { scopeLabel, error } = useWorkspace();

  if (!user) {
    return null;
  }

  return (
    <div className="hidden min-w-0 sm:block">
      <p className="truncate text-xs text-muted">Company</p>
      <p className="truncate text-sm font-medium text-foreground">{scopeLabel || "Office"}</p>
      {error ? <p className="text-[11px] text-primary">{error}</p> : null}
    </div>
  );
}
