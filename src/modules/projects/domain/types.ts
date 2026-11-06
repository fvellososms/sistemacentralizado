export interface Project {
  id: number;
  name: string;
  code: string;
  companyName: string;
  address: string;
  managerName: string;
  status: string;
  startDate: string;
  clientCompanyId?: number | null;
  clientCompanyName?: string | null; // empresa cliente dona da obra
}

