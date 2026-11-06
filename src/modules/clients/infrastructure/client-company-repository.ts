import { db } from "@/db";
import { clientCompanies } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type { ClientCompany } from "../domain/client-companies";

type Row = typeof clientCompanies.$inferSelect;

const toCompany = (row: Row): ClientCompany => ({
  id: row.id,
  name: row.name,
  cnpj: row.cnpj,
  contactName: row.contactName,
  contactEmail: row.contactEmail,
  contactPhone: row.contactPhone,
  active: row.active,
});

export interface ClientCompanyRepository {
  list(): Promise<ClientCompany[]>;
  findById(id: number): Promise<ClientCompany | null>;
  findByName(name: string): Promise<ClientCompany | null>;
  create(data: Omit<ClientCompany, "id">): Promise<ClientCompany>;
  update(id: number, data: Omit<ClientCompany, "id">): Promise<ClientCompany | null>;
}

let clientCompaniesUnavailableUntil = 0;
const TABLE_COOLDOWN_MS = 60_000;

export class DrizzleClientCompanyRepository implements ClientCompanyRepository {
  async list(): Promise<ClientCompany[]> {
    if (Date.now() < clientCompaniesUnavailableUntil) {
      return [];
    }
    try {
      return (await db.select().from(clientCompanies).orderBy(asc(clientCompanies.name))).map(toCompany);
    } catch {
      clientCompaniesUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      return [];
    }
  }

  async findById(id: number): Promise<ClientCompany | null> {
    if (Date.now() < clientCompaniesUnavailableUntil) {
      return null;
    }
    try {
      const [row] = await db.select().from(clientCompanies).where(eq(clientCompanies.id, id)).limit(1);
      return row ? toCompany(row) : null;
    } catch {
      clientCompaniesUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      return null;
    }
  }

  async findByName(name: string): Promise<ClientCompany | null> {
    if (Date.now() < clientCompaniesUnavailableUntil) {
      return null;
    }
    try {
      const [row] = await db.select().from(clientCompanies).where(eq(clientCompanies.name, name)).limit(1);
      return row ? toCompany(row) : null;
    } catch {
      clientCompaniesUnavailableUntil = Date.now() + TABLE_COOLDOWN_MS;
      return null;
    }
  }

  async create(data: Omit<ClientCompany, "id">): Promise<ClientCompany> {
    const [row] = await db.insert(clientCompanies).values(data).returning();
    return toCompany(row);
  }

  async update(id: number, data: Omit<ClientCompany, "id">): Promise<ClientCompany | null> {
    const [row] = await db
      .update(clientCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientCompanies.id, id))
      .returning();
    return row ? toCompany(row) : null;
  }
}

export const defaultClientCompanyRepository = new DrizzleClientCompanyRepository();
