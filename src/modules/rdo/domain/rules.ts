import type { CreateRdoInput } from "./types";

const DOW_NAMES = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/**
 * Computes standard day of the week abbreviation in Portuguese (dom, seg, ter, etc.)
 * using UTC to avoid timezone drift issues across browser/server.
 */
export function computeDayOfWeek(dateString: string): string {
  if (!dateString) return "seg";
  const dateObj = new Date(dateString.includes("T") ? dateString : `${dateString}T12:00:00Z`);
  if (isNaN(dateObj.getTime())) return "seg";
  return DOW_NAMES[dateObj.getUTCDay()];
}

/**
 * Validates domain rules for RDO creation (RN04):
 * - Project ID must be a valid positive number
 * - Date is mandatory
 * - At least one activity with non-empty description is mandatory
 */
export function validateRdoCreation(input: Partial<CreateRdoInput>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.projectId || input.projectId <= 0) {
    errors.push("Obra (projectId) é obrigatória para emissão do RDO.");
  }

  if (!input.date || !input.date.trim()) {
    errors.push("Data do RDO é obrigatória.");
  }

  const activities = Array.isArray(input.activities) ? input.activities : [];
  const validActivities = activities.filter((a) => a && a.description && a.description.trim().length > 0);

  if (validActivities.length === 0) {
    errors.push("É obrigatório informar ao menos uma atividade executada com descrição.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
