import { db } from "@/db";
import { projects } from "@/db/schema";
import { STATIC_PROJECTS } from "../domain/constants";
import type { Project } from "../domain/types";

export async function getProjects(): Promise<Project[]> {
  try {
    const allProjects = await db.select().from(projects).orderBy(projects.id).catch(() => []);
    const dbProjectNames = allProjects.map((p) => p.name);
    const projectsToAdd = STATIC_PROJECTS.filter((p) => !dbProjectNames.includes(p.name));

    return [...allProjects, ...projectsToAdd] as Project[];
  } catch (error) {
    console.warn("getProjects: Database unavailable, returning static projects.");
    return STATIC_PROJECTS;
  }
}

