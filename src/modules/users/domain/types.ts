export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  department: string;
  avatarUrl?: string | null;
}

