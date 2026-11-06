import { db } from "@/db";
import { clientCompanies, projects } from "@/db/schema";
import { asc, eq, getTableColumns } from "drizzle-orm";
import type { Project } from "../domain/types";
import type { ProjectInput } from "../domain/rules";

type Row = typeof projects.$inferSelect & { clientCompanyName: string | null };

const toProject = (row: Row): Project => ({
  id: row.id,
  name: row.name,
  code: row.code,
  companyName: row.companyName,
  address: row.address,
  managerName: row.managerName,
  status: row.status,
  startDate: row.startDate,
  clientCompanyId: row.clientCompanyId,
  clientCompanyName: row.clientCompanyName,
});

const selectWithClient = () =>
  db
    .select({ ...getTableColumns(projects), clientCompanyName: clientCompanies.name })
    .from(projects)
    .leftJoin(clientCompanies, eq(clientCompanies.id, projects.clientCompanyId));

const selectBase = () =>
  db
    .select({
      id: projects.id,
      name: projects.name,
      code: projects.code,
      companyName: projects.companyName,
      address: projects.address,
      managerName: projects.managerName,
      status: projects.status,
      startDate: projects.startDate,
      createdAt: projects.createdAt,
    })
    .from(projects);

export interface ProjectRepository {
  list(): Promise<Project[]>;
  findById(id: number): Promise<Project | null>;
  create(data: Required<Omit<ProjectInput, "clientCompanyId">> & { clientCompanyId: number | null }): Promise<Project>;
  update(id: number, data: Required<Omit<ProjectInput, "clientCompanyId">> & { clientCompanyId: number | null }): Promise<Project | null>;
}

let useLegacyProjectSchema = false;

export class DrizzleProjectRepository implements ProjectRepository {
  async list(): Promise<Project[]> {
    if (!useLegacyProjectSchema) {
      try {
        return (await selectWithClient().orderBy(asc(projects.id))).map(toProject);
      } catch {
        useLegacyProjectSchema = true;
      }
    }
    const rows = await selectBase().orderBy(asc(projects.id));
    return rows.map((r) => toProject({ ...r, clientCompanyId: null, clientCompanyName: null }));
  }

  async findById(id: number): Promise<Project | null> {
    if (!useLegacyProjectSchema) {
      try {
        const [row] = await selectWithClient().where(eq(projects.id, id)).limit(1);
        return row ? toProject(row) : null;
      } catch {
        useLegacyProjectSchema = true;
      }
    }
    const [row] = await selectBase().where(eq(projects.id, id)).limit(1);
    return row ? toProject({ ...row, clientCompanyId: null, clientCompanyName: null }) : null;
  }

  async create(data: Parameters<ProjectRepository["create"]>[0]): Promise<Project> {
    const [row] = await db.insert(projects).values(data).returning({ id: projects.id });
    return (await this.findById(row.id))!;
  }

  async update(id: number, data: Parameters<ProjectRepository["update"]>[1]): Promise<Project | null> {
    const [row] = await db.update(projects).set(data).where(eq(projects.id, id)).returning({ id: projects.id });
    return row ? this.findById(row.id) : null;
  }
}

export const defaultProjectRepository = new DrizzleProjectRepository();
