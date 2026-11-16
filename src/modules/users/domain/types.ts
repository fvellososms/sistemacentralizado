export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  birthDate?: string | null;
  department: string;
  avatarUrl?: string | null;
  accessLevel?: "admin" | "usuario";
  mustChangePassword?: boolean;
}

