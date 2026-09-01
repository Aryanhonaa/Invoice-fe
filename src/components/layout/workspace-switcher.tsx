"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/cn";

export function WorkspaceSwitcher() {
  const { user } = useAuth();
  const { teamId, teams, loading, error, scopeLabel, organizationName, setTeamId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  if (teams.length <= 1) {
    return (
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-xs text-muted">{organizationName ?? "Company"}</p>
        <p className="truncate text-sm font-medium text-slate-700">{scopeLabel || "Office"}</p>
        {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <Button
        variant="secondary"
        size="sm"
        className="max-w-64 justify-start"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate text-left">
          <span className="block truncate text-xs text-muted">{organizationName ?? "Company"}</span>
          <span className="block truncate font-medium">{loading ? "Loading…" : scopeLabel}</span>
        </span>
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 z-30 mt-2 w-72 rounded-[12px] border border-border bg-surface p-2 shadow-md"
        >
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Teams
          </p>
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              role="menuitem"
              className={cn(
                "block w-full rounded-[8px] px-2 py-1.5 text-left text-sm",
                teamId === team.id ? "bg-indigo-50 text-primary" : "text-slate-700 hover:bg-slate-50",
              )}
              onClick={() => {
                setTeamId(team.id);
                setOpen(false);
              }}
            >
              {team.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
