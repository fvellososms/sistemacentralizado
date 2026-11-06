import { db } from "@/db";
import { projects } from "@/db/schema";
import { STATIC_PROJECTS } from "../domain/constants";
import type { Project } from "../domain/types";
import { defaultProjectRepository } from "../infrastructure/project-repository";

let staticSeedAttempted = false;
let cachedProjects: { data: Project[]; expiresAt: number } | null = null;
const PROJECTS_CACHE_TTL_MS = 15_000;

/** Called after admin changes, so the project selector shows them right away. */
export function invalidateProjectsCache() {
  cachedProjects = null;
}

export async function getProjects(): Promise<Project[]> {
  if (cachedProjects && Date.now() < cachedProjects.expiresAt) {
    return cachedProjects.data;
  }

  try {
    let allProjects = await defaultProjectRepository.list();
    if (!staticSeedAttempted) {
      staticSeedAttempted = true;
      const dbProjectIds = new Set(allProjects.map((p) => p.id));
      const dbProjectNames = new Set(allProjects.map((p) => p.name));

      const missingStatic = STATIC_PROJECTS.filter(
        (p) => !dbProjectIds.has(p.id) && !dbProjectNames.has(p.name)
      );

      if (missingStatic.length > 0) {
        await db
          .insert(projects)
          .values(
            missingStatic.map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code,
              companyName: p.companyName,
              address: p.address,
              managerName: p.managerName,
              status: p.status,
              startDate: p.startDate,
            }))
          )
          .onConflictDoNothing()
          .catch(() => {});

        allProjects = await defaultProjectRepository.list();
      }
    }

    const result = allProjects.length > 0 ? allProjects : STATIC_PROJECTS;
    cachedProjects = { data: result, expiresAt: Date.now() + PROJECTS_CACHE_TTL_MS };
    return result;
  } catch (error) {
    console.warn("getProjects: Database unavailable, returning static projects.");
    return STATIC_PROJECTS;
  }
}
