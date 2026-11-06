import fs from "node:fs";
import path from "node:path";
import { STATIC_PROJECTS } from "@/modules/projects";
import type { CreateRdoInput } from "../domain/types";

export interface StoredRdoRecord {
  id: number;
  projectId: number;
  rdoNumber: number;
  date: string;
  dayOfWeek: string;
  dayStatus: string;
  workCondition: string;
  workConditionMorning: string;
  workConditionAfternoon: string;
  weatherMorning: string;
  weatherAfternoon: string;
  ownTeamCount: number;
  contractorTeamCount: number;
  totalHeadcount: number;
  totalHh: string;
  hasOccurrences: boolean;
  observations: string | null;
  authorName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contractors: Array<{
    id: number;
    rdoId: number;
    companyName: string;
    trade: string;
    workerCount: number;
  }>;
  activities: Array<{
    id: number;
    rdoId: number;
    description: string;
    location: string;
    status: string;
    hasOvertime: boolean;
    overtimeHours: string;
  }>;
  nonConformities: Array<{
    id: number;
    rdoId: number;
    description: string;
    nr: string | null;
    severity: string;
    correctiveAction: string;
    status: string;
  }>;
  occurrences: Array<{
    id: number;
    rdoId: number;
    orderIndex: number;
    category: string;
    title: string;
    description: string;
    impactedHours: string;
  }>;
  photos: Array<{
    id: number;
    rdoId: number;
    activityName: string;
    nonConformityText: string | null;
    goodPracticeText: string | null;
    caption: string;
    photoUrl: string;
    timestamp: string;
    locationText: string;
    showWatermark: boolean;
  }>;
}

interface FallbackRdoStoreData {
  nextId: number;
  nextSubId: number;
  items: StoredRdoRecord[];
}

const globalForRdoStore = globalThis as typeof globalThis & {
  __fvellosoRdoFallbackStore?: FallbackRdoStoreData;
  __fvellosoRdoDbDownUntil?: number;
};

const CACHE_FILE_PATH = path.join(process.cwd(), ".next", "cache", "fvelloso-rdos-fallback.json");

function loadFromDisk(): FallbackRdoStoreData | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return {
          nextId: Number(parsed.nextId) || parsed.items.length + 1,
          nextSubId: Number(parsed.nextSubId) || 1000,
          items: parsed.items,
        };
      }
    }
  } catch {
    // ignore disk read errors
  }
  return null;
}

function saveToDisk(store: FallbackRdoStoreData): void {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // ignore disk write errors
  }
}

function ensureStore(): FallbackRdoStoreData {
  if (!globalForRdoStore.__fvellosoRdoFallbackStore) {
    globalForRdoStore.__fvellosoRdoFallbackStore = loadFromDisk() ?? {
      nextId: 1,
      nextSubId: 1,
      items: [],
    };
  }
  return globalForRdoStore.__fvellosoRdoFallbackStore;
}

export function isRdoDbRecentlyDown(): boolean {
  const until = globalForRdoStore.__fvellosoRdoDbDownUntil ?? 0;
  return Date.now() < until;
}

export function markRdoDbDown(cooldownMs = 20_000): void {
  globalForRdoStore.__fvellosoRdoDbDownUntil = Date.now() + cooldownMs;
}

export function getNextFallbackRdoNumber(projectId: number): number {
  const store = ensureStore();
  const projectItems = store.items.filter((r) => r.projectId === projectId);
  if (projectItems.length === 0) return 1;
  return Math.max(...projectItems.map((r) => r.rdoNumber || 0)) + 1;
}

export function formatRdoForList(rdo: StoredRdoRecord) {
  const { contractors, activities, nonConformities, occurrences, photos, ...rest } = rdo;
  return {
    ...rest,
    activitiesCount: activities.length,
    activitiesSummary: activities.map((a) => a.description).join("; "),
    contractorsList: contractors,
    occurrencesCount: occurrences.length,
    nonConformitiesList: nonConformities,
    photosCount: photos.length,
    photosPreview: photos.slice(0, 3).map((p) => p.photoUrl),
  };
}

export function listRawFallbackRdos(filter?: {
  projectId?: number;
  startDate?: string | null;
  endDate?: string | null;
}): StoredRdoRecord[] {
  const store = ensureStore();
  let list = [...store.items];

  if (filter?.projectId) {
    list = list.filter((r) => r.projectId === filter.projectId);
  }
  if (filter?.startDate && filter?.endDate) {
    list = list.filter((r) => r.date >= filter.startDate! && r.date <= filter.endDate!);
  }

  list.sort((a, b) => a.date.localeCompare(b.date));
  return list;
}

export function listFallbackRdos(filter?: { projectId?: number; month?: string }) {
  const store = ensureStore();
  let list = [...store.items];

  if (filter?.projectId) {
    list = list.filter((r) => r.projectId === filter.projectId);
  }
  if (filter?.month) {
    list = list.filter((r) => r.date.startsWith(filter.month!));
  }

  list.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });

  return list.map(formatRdoForList);
}

export function findFallbackRdoById(id: number) {
  const store = ensureStore();
  const found = store.items.find((r) => r.id === id);
  if (!found) return null;
  const project =
    STATIC_PROJECTS.find((p) => p.id === found.projectId) ?? STATIC_PROJECTS[0] ?? null;
  return {
    ...found,
    project,
  };
}

export function createFallbackRdo(
  data: CreateRdoInput & {
    rdoNumber: number;
    dayOfWeek: string;
    totalHh: string;
    totalHeadcount: number;
    contractorTeamCount: number;
    ownTeamCount: number;
  }
): StoredRdoRecord {
  const store = ensureStore();
  const rdoId = store.nextId++;
  const nowIso = new Date().toISOString();
  const occurrencesInput = Array.isArray(data.occurrences) ? data.occurrences : [];
  const hasOccurrences = occurrencesInput.length > 0 || Boolean(data.hasOccurrences);

  const contractors = (data.contractors || [])
    .filter((c) => c && c.companyName)
    .map((c) => ({
      id: store.nextSubId++,
      rdoId,
      companyName: c.companyName,
      trade: c.trade || "Construção Civil",
      workerCount: parseInt(String(c.workerCount ?? 1), 10) || 1,
    }));

  const activities = (data.activities || [])
    .filter((a) => a && a.description)
    .map((a) => ({
      id: store.nextSubId++,
      rdoId,
      description: a.description,
      location: a.location || "Canteiro Geral",
      status: a.status || "em_andamento",
      hasOvertime: Boolean(a.hasOvertime),
      overtimeHours: a.overtimeHours ? String(a.overtimeHours) : "0",
    }));

  const nonConformities = (data.nonConformities || [])
    .filter((nc) => nc && nc.description)
    .map((nc) => ({
      id: store.nextSubId++,
      rdoId,
      description: nc.description,
      nr: nc.nr || null,
      severity: nc.severity || "media",
      correctiveAction: nc.correctiveAction || "",
      status: nc.status || "resolvido",
    }));

  let occIdx = 1;
  const occurrences = occurrencesInput
    .filter((occ) => occ && (occ.title || occ.description))
    .map((occ) => {
      const orderIndex = occIdx++;
      return {
        id: store.nextSubId++,
        rdoId,
        orderIndex,
        category: occ.category || "Geral",
        title: occ.title || `Ocorrência #${orderIndex}`,
        description: occ.description || "",
        impactedHours: occ.impactedHours ? String(occ.impactedHours) : "0",
      };
    });

  const photos = (data.photos || [])
    .filter((p) => p && p.photoUrl)
    .map((p) => ({
      id: store.nextSubId++,
      rdoId,
      activityName: p.activityName || "Serviço Geral de Canteiro",
      nonConformityText: p.nonConformityText || null,
      goodPracticeText: p.goodPracticeText || null,
      caption: p.caption || "",
      photoUrl: p.photoUrl,
      timestamp: p.timestamp || `${data.date} ${new Date().toTimeString().slice(0, 8)}`,
      locationText: p.locationText || "Canteiro de Obras",
      showWatermark: p.showWatermark !== false,
    }));

  const record: StoredRdoRecord = {
    id: rdoId,
    projectId: data.projectId,
    rdoNumber: data.rdoNumber,
    date: data.date,
    dayOfWeek: data.dayOfWeek,
    dayStatus: data.dayStatus || "trabalhando",
    workCondition: data.workCondition || "praticavel",
    workConditionMorning: data.workConditionMorning || "praticavel",
    workConditionAfternoon: data.workConditionAfternoon || "praticavel",
    weatherMorning: data.weatherMorning || "sol",
    weatherAfternoon: data.weatherAfternoon || "sol",
    ownTeamCount: data.ownTeamCount,
    contractorTeamCount: data.contractorTeamCount,
    totalHeadcount: data.totalHeadcount,
    totalHh: data.totalHh,
    hasOccurrences,
    observations: data.observations || null,
    authorName: data.authorName || "Alberto Martins",
    status: "concluido",
    createdAt: nowIso,
    updatedAt: nowIso,
    contractors,
    activities,
    nonConformities,
    occurrences,
    photos,
  };

  store.items.push(record);
  saveToDisk(store);
  return record;
}

export function updateFallbackRdo(
  id: number,
  patch: Partial<StoredRdoRecord> & {
    contractors?: any[];
    activities?: any[];
    nonConformities?: any[];
    occurrences?: any[];
    photos?: any[];
  }
): StoredRdoRecord | null {
  const store = ensureStore();
  const idx = store.items.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const existing = store.items[idx];
  const updated: StoredRdoRecord = {
    ...existing,
    dayStatus: patch.dayStatus ?? existing.dayStatus,
    workCondition: patch.workCondition ?? existing.workCondition,
    workConditionMorning: patch.workConditionMorning ?? existing.workConditionMorning,
    workConditionAfternoon: patch.workConditionAfternoon ?? existing.workConditionAfternoon,
    weatherMorning: patch.weatherMorning ?? existing.weatherMorning,
    weatherAfternoon: patch.weatherAfternoon ?? existing.weatherAfternoon,
    ownTeamCount: patch.ownTeamCount ?? existing.ownTeamCount,
    contractorTeamCount: patch.contractorTeamCount ?? existing.contractorTeamCount,
    totalHeadcount: patch.totalHeadcount ?? existing.totalHeadcount,
    totalHh: patch.totalHh ?? existing.totalHh,
    hasOccurrences: patch.hasOccurrences ?? existing.hasOccurrences,
    observations: patch.observations !== undefined ? patch.observations : existing.observations,
    updatedAt: new Date().toISOString(),
    contractors: Array.isArray(patch.contractors)
      ? patch.contractors
          .filter((c) => c && c.companyName)
          .map((c) => ({
            id: store.nextSubId++,
            rdoId: id,
            companyName: c.companyName,
            trade: c.trade || "Construção Civil",
            workerCount: parseInt(String(c.workerCount ?? 1), 10) || 1,
          }))
      : existing.contractors,
    activities: Array.isArray(patch.activities)
      ? patch.activities
          .filter((a) => a && a.description)
          .map((a) => ({
            id: store.nextSubId++,
            rdoId: id,
            description: a.description,
            location: a.location || "Canteiro Geral",
            status: a.status || "em_andamento",
            hasOvertime: Boolean(a.hasOvertime),
            overtimeHours: a.overtimeHours ? String(a.overtimeHours) : "0",
          }))
      : existing.activities,
    nonConformities: Array.isArray(patch.nonConformities)
      ? patch.nonConformities
          .filter((nc) => nc && nc.description)
          .map((nc) => ({
            id: store.nextSubId++,
            rdoId: id,
            description: nc.description,
            nr: nc.nr || null,
            severity: nc.severity || "media",
            correctiveAction: nc.correctiveAction || "",
            status: nc.status || "resolvido",
          }))
      : existing.nonConformities,
    occurrences: Array.isArray(patch.occurrences)
      ? patch.occurrences
          .filter((occ) => occ && (occ.title || occ.description))
          .map((occ, i) => ({
            id: store.nextSubId++,
            rdoId: id,
            orderIndex: i + 1,
            category: occ.category || "Geral",
            title: occ.title || `Ocorrência #${i + 1}`,
            description: occ.description || "",
            impactedHours: occ.impactedHours ? String(occ.impactedHours) : "0",
          }))
      : existing.occurrences,
    photos: Array.isArray(patch.photos)
      ? patch.photos
          .filter((p) => p && p.photoUrl)
          .map((p) => ({
            id: store.nextSubId++,
            rdoId: id,
            activityName: p.activityName || "Serviço Geral de Canteiro",
            nonConformityText: p.nonConformityText || null,
            goodPracticeText: p.goodPracticeText || null,
            caption: p.caption || "",
            photoUrl: p.photoUrl,
            timestamp: p.timestamp || `${existing.date} ${new Date().toTimeString().slice(0, 8)}`,
            locationText: p.locationText || "Canteiro de Obras",
            showWatermark: p.showWatermark !== false,
          }))
      : existing.photos,
  };

  store.items[idx] = updated;
  saveToDisk(store);
  return updated;
}

export function deleteFallbackRdo(id: number): boolean {
  const store = ensureStore();
  const prevLen = store.items.length;
  store.items = store.items.filter((r) => r.id !== id);
  if (store.items.length !== prevLen) {
    saveToDisk(store);
    return true;
  }
  return false;
}

export function deleteFallbackPhoto(photoId: number): boolean {
  const store = ensureStore();
  let removed = false;
  for (const rdo of store.items) {
    const before = rdo.photos.length;
    rdo.photos = rdo.photos.filter((p) => p.id !== photoId);
    if (rdo.photos.length !== before) {
      removed = true;
    }
  }
  if (removed) {
    saveToDisk(store);
  }
  return removed;
}
