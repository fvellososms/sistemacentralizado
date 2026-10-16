export interface RsoSummary {
  totalRdos: number;
  totalDaysWorked: number;
  totalDaysHalted: number;
  totalHh: string;
  totalOccurrences: number;
  avgHeadcount: number;
}

export interface RsoReport {
  project: any | null;
  period: {
    startDate?: string | null;
    endDate?: string | null;
  };
  summary: RsoSummary;
  rdos: any[];
  contractors: any[];
  activities: any[];
  occurrences: any[];
  photos: any[];
}

