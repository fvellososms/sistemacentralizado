import { db } from "@/db";
import { projects } from "@/db/schema";
import { STATIC_PROJECTS } from "../domain/constants";
import type { Project } from "../domain/types";

export async function getProjects(): Promise<Project[]> {
  try {
    let allProjects = await db.select().from(projects).orderBy(projects.id);
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
        .onConflictDoNothing();

      allProjects = await db.select().from(projects).orderBy(projects.id);
    }

    return allProjects.length > 0 ? (allProjects as Project[]) : STATIC_PROJECTS;
  } catch (error) {
    console.warn("getProjects: Database unavailable, returning static projects.");
    return STATIC_PROJECTS;
  }
}
