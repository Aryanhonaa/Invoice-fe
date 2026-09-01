"use client";

/* eslint-disable react-hooks/set-state-in-effect -- hydrates team selection after login */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { listTeams } from "@/services/teams.service";
import type { OrganizationSummary } from "@/types/admin";
import type { Team } from "@/types/team";

interface WorkspaceContextValue {
  organizationId: string | null;
  teamId: string | null;
  teams: Team[];
  organizations: OrganizationSummary[];
  loading: boolean;
  error: string | null;
  generation: number;
  allowAllTeams: boolean;
  scopeLabel: string;
  organizationName: string | null;
  selectedTeamName: string | null;
  setOrganizationId: (id: string | null) => void;
  setTeamId: (id: string | null) => void;
  refresh: () => Promise<void>;
  tenantListsReady: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function teamKey(userId: string) {
  return `outinvoice.teamId:${userId}`;
}

function readStored(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [teamId, setTeamIdState] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const organizationId = user?.organizationId ?? null;
  const allowAllTeams = user?.role === "SUPER_ADMIN";
  const tenantListsReady = true;

  useEffect(() => {
    if (!user) {
      setHydrated(false);
      return;
    }
    setTeamIdState(readStored(teamKey(user.id)));
    setHydrated(true);
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await listTeams({
        status: "ACTIVE",
        pageSize: 50,
      });
      setTeams(result.items);
      setTeamIdState((current) => {
        if (result.items.length === 1) {
          return result.items[0].id;
        }
        if (current && !result.items.some((team) => team.id === current)) {
          window.localStorage.removeItem(teamKey(user.id));
          return null;
        }
        return current;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load teams.");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void refresh();
  }, [hydrated, refresh]);

  const setOrganizationId = useCallback((_id: string | null) => {
    return;
  }, []);

  const setTeamId = useCallback(
    (id: string | null) => {
      if (!user) {
        return;
      }
      setTeamIdState(id);
      setGeneration((current) => current + 1);
      if (id) {
        window.localStorage.setItem(teamKey(user.id), id);
      } else {
        window.localStorage.removeItem(teamKey(user.id));
      }
    },
    [user],
  );

  const selectedTeam = teams.find((team) => team.id === teamId) ?? null;
  const organizationName = teams[0]?.organization?.name ?? "Company";

  const scopeLabel = useMemo(() => {
    if (!user) {
      return "";
    }
    if (selectedTeam) {
      return selectedTeam.name;
    }
    if (user.role === "SUPER_ADMIN") {
      return "Company";
    }
    if (user.role === "MEMBER") {
      return teams.length === 0 ? "No assigned team" : "My team";
    }
    return teams.length === 1 ? teams[0].name : "Team";
  }, [selectedTeam, teams, user]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organizationId,
      teamId,
      teams,
      organizations: [],
      loading,
      error,
      generation,
      allowAllTeams,
      scopeLabel,
      organizationName,
      selectedTeamName: selectedTeam?.name ?? null,
      setOrganizationId,
      setTeamId,
      refresh,
      tenantListsReady,
    }),
    [
      allowAllTeams,
      error,
      generation,
      loading,
      organizationId,
      organizationName,
      refresh,
      scopeLabel,
      selectedTeam?.name,
      setOrganizationId,
      setTeamId,
      teamId,
      teams,
      tenantListsReady,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
