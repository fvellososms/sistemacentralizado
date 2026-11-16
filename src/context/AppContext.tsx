"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { Project } from "@/modules/projects/domain/types";
import { STATIC_PROJECTS } from "@/modules/projects/domain/constants";
import type { UserProfile } from "@/modules/users/domain/types";
import { DEFAULT_PROFILE } from "@/modules/users/domain/constants";
import { mergeUserProfile, parseStoredUserSession } from "@/modules/users/domain/rules";

export type { Project, UserProfile };


interface AppContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  refreshProfile: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  isCreateModalOpen: boolean;
  openCreateModal: (initialDate?: string) => void;
  closeCreateModal: () => void;
  createModalInitialDate?: string;
  hasLocalDraft: boolean;
  setHasLocalDraft: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(STATIC_PROJECTS);
  const [activeProject, setActiveProjectState] = useState<Project | null>(STATIC_PROJECTS[0]);
  const [profile, setProfileState] = useState<UserProfile | null>(DEFAULT_PROFILE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialDate, setCreateModalInitialDate] = useState<string | undefined>(undefined);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [projetosCarregados, setProjetosCarregados] = useState(false);
  const router = useRouter();
  const activeProjectId = activeProject?.id;

  const setProfile = (nextProfile: UserProfile) => {
    setProfileState(nextProfile);
    if (typeof window !== "undefined") {
      try {
        const existingSession = parseStoredUserSession(localStorage.getItem("rdo_user_session"));
        if (existingSession) {
          // Rewritten from the profile only, so fields the system no longer keeps (CPF, address) leave the browser too.
          localStorage.setItem(
            "rdo_user_session",
            JSON.stringify({ ...nextProfile, loggedAt: existingSession.loggedAt || new Date().toISOString() })
          );
        }
      } catch {
        // ignore storage errors
      }
    }
  };


  const setActiveProject = (proj: Project) => {
    setActiveProjectState(proj);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("rdo_active_project_id", String(proj.id));
      } catch {
        // ignore storage errors
      }
    }
  };

  const refreshProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();

      let all = [...STATIC_PROJECTS];
      if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
        const dbNames = data.projects.map((p: Project) => p.name);
        const filteredStatic = STATIC_PROJECTS.filter((p) => !dbNames.includes(p.name));
        all = [...data.projects, ...filteredStatic];
      }

      setProjects(all);
      setActiveProjectState((prev) => {
        const savedId =
          typeof window !== "undefined"
            ? Number(localStorage.getItem("rdo_active_project_id"))
            : NaN;
        // The saved choice wins: `prev` starts as the first static project, not as what the user selected.
        const targetId = savedId > 0 ? savedId : prev?.id;
        if (targetId !== undefined) {
          const found = all.find((p: Project) => p.id === targetId);
          if (found) {
            if (prev && prev.id === found.id && prev.name === found.name) {
              return prev;
            }
            return found;
          }
        }
        return all[0];
      });
    } catch (e) {
      console.error("Failed to load projects:", e);
      setProjects(STATIC_PROJECTS);
      setActiveProjectState((prev) => prev || STATIC_PROJECTS[0]);
    } finally {
      setProjetosCarregados(true);
    }
  };

  // The APR screens read the project on the server: tell it which one is selected in the header.
  useEffect(() => {
    if (!projetosCarregados || !activeProjectId) return;
    fetch("/api/apr/sessao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: activeProjectId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.mudou && window.location.pathname.startsWith("/apr")) router.refresh();
      })
      .catch(() => undefined);
  }, [projetosCarregados, activeProjectId, router]);

  const refreshProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      // The server is the source of truth, including "no photo".
      if (data.profile) setProfile(data.profile as UserProfile);
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSession = parseStoredUserSession(localStorage.getItem("rdo_user_session"));
      if (storedSession) {
        setProfileState(mergeUserProfile(DEFAULT_PROFILE, storedSession));
        // Copies saved before CPF and address left the system are cleaned from the browser (LGPD).
        const limpo = { ...storedSession } as Record<string, unknown>;
        if ("cpf" in limpo || "address" in limpo) {
          delete limpo.cpf;
          delete limpo.address;
          try {
            localStorage.setItem("rdo_user_session", JSON.stringify(limpo));
          } catch {
            // ignore storage errors
          }
        }
      }
    }

    refreshProjects();
    refreshProfile();


    // Check draft existence in localStorage
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("rdo_draft_v1");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const hasContent =
            Boolean(parsed.observations?.trim()) ||
            (Array.isArray(parsed.contractors) && parsed.contractors.some((c: any) => c.companyName?.trim())) ||
            (Array.isArray(parsed.activities) && parsed.activities.some((a: any) => a.description?.trim())) ||
            (Array.isArray(parsed.photos) && parsed.photos.length > 0) ||
            (Array.isArray(parsed.nonConformities) && parsed.nonConformities.length > 0) ||
            (Array.isArray(parsed.occurrences) && parsed.occurrences.length > 0);

          if (parsed && hasContent) {
            setHasLocalDraft(true);
          }
        } catch {
          // invalid draft
        }
      }
    }
  }, []);

  const openCreateModal = (initialDate?: string) => {
    setCreateModalInitialDate(initialDate);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateModalInitialDate(undefined);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        profile,
        setProfile,
        refreshProfile,
        refreshProjects,
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        createModalInitialDate,
        hasLocalDraft,
        setHasLocalDraft,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
