import type { AprStatus } from "@/lib/apr/types";

export interface StatusTransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates state transitions for APR lifecycle (RN09):
 * - rascunho -> aguardando_aprovacao
 * - reprovada -> rascunho (on editing)
 * - aguardando_aprovacao -> aprovada (approver only)
 * - aguardando_aprovacao -> reprovada (approver only, requires justification)
 * - aprovada is IMMUTABLE and cannot be transitioned or edited.
 */
export function canTransitionAprStatus(
  currentStatus: AprStatus,
  targetStatus: AprStatus,
  context?: { hasMotivo?: boolean }
): StatusTransitionResult {
  if (currentStatus === "aprovada") {
    return {
      allowed: false,
      reason: "APR aprovada é um registro imutável e não pode sofrer alterações de status.",
    };
  }

  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  if (currentStatus === "rascunho" && targetStatus === "aguardando_aprovacao") {
    return { allowed: true };
  }

  if (currentStatus === "reprovada" && targetStatus === "rascunho") {
    return { allowed: true };
  }

  if (currentStatus === "aguardando_aprovacao") {
    if (targetStatus === "aprovada") {
      return { allowed: true };
    }
    if (targetStatus === "reprovada") {
      if (!context?.hasMotivo) {
        return {
          allowed: false,
          reason: "Informe o motivo da reprovação para orientar a correção pelo elaborador.",
        };
      }
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: `Transição inválida de status: de "${currentStatus}" para "${targetStatus}".`,
  };
}

