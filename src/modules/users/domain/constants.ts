import type { UserProfile } from "./types";

export const DEFAULT_PROFILE: UserProfile = {
  id: 1,
  name: "Fábio Velloso",
  email: "fvellososms@gmail.com",
  role: "Encarregado Geral de Obra",
  phone: null,
  birthDate: null,
  department: "Engenharia & Produção",
  avatarUrl: null, // no photo: the initials of the name are shown
};

