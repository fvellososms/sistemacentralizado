export type DayStatus = "trabalhando" | "paralisado_chuva" | "nao_trabalhando";
export type WorkCondition = "praticavel" | "impraticavel";
export type WeatherCondition = "sol" | "parcialmente_nublado" | "nublado" | "chuva";
export type NonConformitySeverity = "baixa" | "media" | "alta";
export type NonConformityStatus = "resolvido" | "pendente";
export type ActivityStatus = "em_andamento" | "concluido";

export interface ContractorInput {
  id?: number;
  companyName: string;
  trade?: string;
  workerCount: number | string;
}

export interface ActivityInput {
  id?: number;
  description: string;
  location?: string;
  status?: ActivityStatus | string;
  hasOvertime?: boolean;
  overtimeHours?: number | string;
}

export interface NonConformityInput {
  id?: number;
  description: string;
  nr?: string | null;
  severity?: NonConformitySeverity;
  correctiveAction?: string;
  status?: NonConformityStatus;
}

export interface OccurrenceInput {
  id?: number;
  orderIndex?: number;
  category?: string;
  title?: string;
  description: string;
  impactedHours?: number | string;
}

export interface PhotoInput {
  id?: number;
  activityName?: string;
  nonConformityText?: string | null;
  goodPracticeText?: string | null;
  caption?: string;
  photoUrl: string;
  timestamp?: string;
  locationText?: string;
  showWatermark?: boolean;
}

export interface CreateRdoInput {
  projectId: number;
  date: string;
  dayStatus?: DayStatus;
  workCondition?: WorkCondition;
  weatherMorning?: WeatherCondition;
  weatherAfternoon?: WeatherCondition;
  ownTeamCount?: number | string;
  authorName?: string;
  observations?: string | null;
  totalHh?: string | number;
  hasOccurrences?: boolean;
  contractors?: ContractorInput[];
  activities?: ActivityInput[];
  nonConformities?: NonConformityInput[];
  occurrences?: OccurrenceInput[];
  photos?: PhotoInput[];
}

