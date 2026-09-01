"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  isNavItemActive,
  NAV_GROUPS,
  pageTitleForPath,
  ROLE_LABELS,
  type NavIcon,
  type NavItem,
} from "@/config/navigation";
import { cn } from "@/lib/cn";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import type { UserRole } from "@/types/auth";

const SIDEBAR_KEY = "outinvoice.sidebarCollapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(() =>
    typeof window === "undefined" ? false : window.localStorage.getItem(SIDEBAR_KEY) === "1",
  );

  const groups = useMemo(() => {
    if (!user) {
      return [];
    }
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
          (item) =>
            item.roles.includes(user.role) &&
            (!item.permission || user.permissions.includes(item.permission)),
        ),
    })).filter((group) => group.items.length > 0);
  }, [user]);

  const pageTitle = pageTitleForPath(pathname, `?${search}`);

  useEffect(() => {
    if (!menuOpen && !navOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (menuOpen && !accountMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNavOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, navOpen]);

  async function handleLogout() {
    await logout();
    notify("Signed out.");
    router.replace("/login");
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  function renderGroups(onNavigate?: () => void, compact = false) {
    return groups.map((group) => (
      <div key={group.id} className="space-y-0.5">
        {group.label && !compact ? (
          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
            {group.label}
          </p>
        ) : compact ? (
          <div className="mx-auto my-2 h-px w-6 bg-border" />
        ) : null}
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            search={search}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    ));
  }

  const initials = user
    ? `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase()
    : "U";

  return (
    <div className="flex h-svh min-h-0 flex-1 overflow-hidden">
      <aside
        className={cn(
          "hidden h-full shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          {collapsed ? (
            <p className="w-full text-center text-sm font-semibold text-primary">OI</p>
          ) : (
            <div>
              <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">OutInvoice</p>
              <p className="text-[11px] text-sidebar-muted">
                {user?.role === "SUPER_ADMIN" ? "Company" : "Office"}
              </p>
            </div>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2" aria-label="Main">
          {renderGroups(undefined, collapsed)}
        </nav>
        <div className="border-t border-sidebar-border p-2">
          <Button variant="sidebarGhost" size="sm" className="w-full" onClick={toggleCollapsed}>
            {collapsed ? "»" : "Collapse"}
          </Button>
        </div>
      </aside>

      {navOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#141517]/50"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="border-b border-sidebar-border px-5 py-4">
              <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">OutInvoice</p>
              <p className="mt-0.5 text-xs text-sidebar-muted">
                {user?.role === "SUPER_ADMIN" ? "Company" : "Office"}
              </p>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Mobile">
              {renderGroups(() => setNavOpen(false))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
            >
              Menu
            </Button>
            <p className="truncate text-sm font-medium text-muted md:hidden">{pageTitle}</p>
            {user ? (
              <div className="hidden md:block">
                <WorkspaceSwitcher />
              </div>
            ) : null}
          </div>
          <div className="relative" ref={accountMenuRef}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                {initials}
              </span>
              <span className="hidden max-w-40 truncate sm:inline">
                {user ? `${user.firstName} ${user.lastName}` : "Account"}
              </span>
            </Button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-surface p-2"
              >
                <p className="px-2 py-1 text-xs font-medium text-foreground">
                  {user ? ROLE_LABELS[user.role as UserRole] : ""}
                </p>
                <p className="truncate px-2 pb-2 text-xs text-muted">{user?.email}</p>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setMenuOpen(false);
                    void handleLogout();
                  }}
                >
                  Sign out
                </Button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  search,
  compact,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  search: string;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const active = isNavItemActive(item, pathname, `?${search}`);
  return (
    <Link
      href={item.href}
      title={compact ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-medium transition-colors",
        compact && "justify-center px-2",
        active ? "bg-primary text-primary-foreground" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
      )}
    >
      <NavIconMark name={item.icon} />
      {compact ? <span className="sr-only">{item.label}</span> : item.label}
    </Link>
  );
}

function NavIconMark({ name }: { name: NavIcon }) {
  const common = "h-4 w-4 shrink-0";
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <path d="M2.5 7.2 8 2.8l5.5 4.4V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7.2Z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "invoice":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <path d="M4 2.5h8v11l-2-1.2-2 1.2-2-1.2-2 1.2v-11Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 6h4M6 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "customer":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <circle cx="8" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.5 13c.6-2.2 2.3-3.4 4.5-3.4s3.9 1.2 4.5 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "product":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <path d="M3 5.2 8 2.8l5 2.4v5.6L8 13.2 3 10.8V5.2Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 13.2V8M3 5.2 8 8l5-2.8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "payment":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <rect x="2.5" y="4" width="11" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "expense":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <path d="M4 12.5 12 3.5M6.5 3.5H12v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "report":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <path d="M3.5 12.5V8M8 12.5V4M12.5 12.5V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "team":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <circle cx="6" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="11" cy="6.5" r="1.4" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.8 12.5c.5-1.8 1.9-2.8 3.5-2.8 1.4 0 2.6.7 3.3 1.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "member":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <circle cx="8" cy="5.2" r="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4 12.5c.5-2 2-3 4-3s3.5 1 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 2.5v1.5M8 12v1.5M2.5 8h1.5M12 8h1.5M4.1 4.1l1.1 1.1M10.8 10.8l1.1 1.1M4.1 11.9l1.1-1.1M10.8 5.2l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" fill="none" className={common} aria-hidden>
          <path d="M8 2.5 13.5 6v6.5H2.5V6L8 2.5Z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
  }
}
