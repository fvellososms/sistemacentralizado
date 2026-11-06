import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type UserRow = typeof userProfiles.$inferSelect;
export type UserInsert = typeof userProfiles.$inferInsert;

/** Reads do not swallow errors: callers must tell "not found" apart from "database down". */
export interface UserRepository {
  findByEmail(email: string): Promise<UserRow | null>;
  findById(id: number): Promise<UserRow | null>;
  list(): Promise<UserRow[]>;
  create(values: UserInsert): Promise<UserRow>;
  update(id: number, values: Partial<UserInsert>): Promise<UserRow | null>;
}

const selectBaseUser = () =>
  db
    .select({
      id: userProfiles.id,
      name: userProfiles.name,
      email: userProfiles.email,
      role: userProfiles.role,
      cpf: userProfiles.cpf,
      phone: userProfiles.phone,
      birthDate: userProfiles.birthDate,
      address: userProfiles.address,
      department: userProfiles.department,
      avatarUrl: userProfiles.avatarUrl,
      passwordHash: userProfiles.passwordHash,
      updatedAt: userProfiles.updatedAt,
    })
    .from(userProfiles);

function withLegacyDefaults(row: {
  id: number;
  name: string;
  email: string;
  role: string;
  cpf: string | null;
  phone: string | null;
  birthDate: string | null;
  address: string | null;
  department: string;
  avatarUrl: string | null;
  passwordHash: string | null;
  updatedAt: Date;
}): UserRow {
  return {
    ...row,
    // created_at and the access columns only exist after migration 0005.
    createdAt: row.updatedAt,
    accessLevel: "usuario",
    active: true,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
  };
}

let useLegacyUserSchema = false;

/**
 * Only "column does not exist" (Postgres 42703, migration 0005 not applied yet) switches to the legacy
 * schema. Any other failure (e.g. the database paused for a moment) is rethrown; switching on those
 * would silently turn off the login lockout until the next restart.
 */
function switchToLegacyOrThrow(error: unknown): void {
  const code = (e: unknown) => (e && typeof e === "object" && "code" in e ? (e as { code?: unknown }).code : undefined);
  const cause = error && typeof error === "object" && "cause" in error ? (error as { cause?: unknown }).cause : undefined;
  if (code(error) !== "42703" && code(cause) !== "42703") throw error;
  if (!useLegacyUserSchema) console.warn("user_profiles sem as colunas da migração 0005: usando o esquema antigo (sem bloqueio de login).");
  useLegacyUserSchema = true;
}

export class DrizzleUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    if (!useLegacyUserSchema) {
      try {
        const [row] = await db.select().from(userProfiles).where(eq(userProfiles.email, email)).limit(1);
        return row ?? null;
      } catch (error) {
        switchToLegacyOrThrow(error);
      }
    }
    const [row] = await selectBaseUser().where(eq(userProfiles.email, email)).limit(1);
    return row ? withLegacyDefaults(row) : null;
  }

  async findById(id: number): Promise<UserRow | null> {
    if (!useLegacyUserSchema) {
      try {
        const [row] = await db.select().from(userProfiles).where(eq(userProfiles.id, id)).limit(1);
        return row ?? null;
      } catch (error) {
        switchToLegacyOrThrow(error);
      }
    }
    const [row] = await selectBaseUser().where(eq(userProfiles.id, id)).limit(1);
    return row ? withLegacyDefaults(row) : null;
  }

  async list(): Promise<UserRow[]> {
    if (!useLegacyUserSchema) {
      try {
        return await db.select().from(userProfiles).orderBy(asc(userProfiles.name));
      } catch (error) {
        switchToLegacyOrThrow(error);
      }
    }
    const rows = await selectBaseUser().orderBy(asc(userProfiles.name));
    return rows.map(withLegacyDefaults);
  }

  async create(values: UserInsert): Promise<UserRow> {
    const [row] = await db.insert(userProfiles).values(values).returning();
    return row;
  }

  async update(id: number, values: Partial<UserInsert>): Promise<UserRow | null> {
    if (!useLegacyUserSchema) {
      try {
        const [row] = await db
          .update(userProfiles)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(userProfiles.id, id))
          .returning();
        return row ?? null;
      } catch (error) {
        switchToLegacyOrThrow(error);
      }
    }
    const {
      accessLevel: _al,
      active: _ac,
      mustChangePassword: _mcp,
      failedLoginAttempts: _fla,
      lockedUntil: _lu,
      lastLoginAt: _lla,
      ...legacyValues
    } = values;
    await db
      .update(userProfiles)
      .set({ ...legacyValues, updatedAt: new Date() })
      .where(eq(userProfiles.id, id));
    return this.findById(id);
  }
}

export const defaultUserRepository = new DrizzleUserRepository();
