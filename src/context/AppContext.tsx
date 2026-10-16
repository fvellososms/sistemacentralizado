"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

import type { Project } from "@/modules/projects/domain/types";
import { STATIC_PROJECTS } from "@/modules/projects/domain/constants";
import type { UserProfile } from "@/modules/users/domain/types";
import { DEFAULT_PROFILE } from "@/modules/users/domain/constants";

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
  const [profile, setProfile] = useState<UserProfile | null>(DEFAULT_PROFILE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialDate, setCreateModalInitialDate] = useState<string | undefined>(undefined);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

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
        const targetId = prev?.id ?? (!isNaN(savedId) ? savedId : undefined);
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
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  };

  useEffect(() => {
    refreshProjects();
    refreshProfile();

    // Check draft existence in localStorage
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("rdo_draft_v1");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed && (parsed.activities?.length || parsed.contractors?.length || parsed.observations)) {
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
