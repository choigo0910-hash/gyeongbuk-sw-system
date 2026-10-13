/**
 * Status enums for all entities in gyeongbuk-sw-system
 */

/**
 * Budget status
 */
export enum BudgetStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  REVIEWING = "reviewing",
  REVISION_REQUESTED = "revision_requested",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export const budgetStatusLabels: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: "작성 중",
  [BudgetStatus.SUBMITTED]: "제출 완료",
  [BudgetStatus.REVIEWING]: "검토 중",
  [BudgetStatus.REVISION_REQUESTED]: "보완 요청",
  [BudgetStatus.APPROVED]: "승인 완료",
  [BudgetStatus.REJECTED]: "반려",
}

export const budgetStatusColors: Record<BudgetStatus, string> = {
  [BudgetStatus.DRAFT]: "gray",
  [BudgetStatus.SUBMITTED]: "blue",
  [BudgetStatus.REVIEWING]: "orange",
  [BudgetStatus.REVISION_REQUESTED]: "orange",
  [BudgetStatus.APPROVED]: "green",
  [BudgetStatus.REJECTED]: "red",
}

/**
 * Purchase request status
 */
export enum PurchaseRequestStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  REVIEWING = "reviewing",
  APPROVED = "approved",
  REJECTED = "rejected",
  PURCHASE_COMPLETED = "purchase_completed",
  PROOF_SUBMITTED = "proof_submitted",
  PROOF_APPROVED = "proof_approved",
  PROOF_REJECTED = "proof_rejected",
  COMPLETED = "completed",
}

/**
 * Refund application status
 */
export enum RefundStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  REVIEWING = "reviewing",
  REVISION_REQUESTED = "revision_requested",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSING = "processing",
  COMPLETED = "completed",
}

/**
 * Program status
 */
export enum ProgramStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  UNPUBLISHED = "unpublished",
  ARCHIVED = "archived",
}

/**
 * Program application status
 */
export enum ApplicationStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  REVIEWING = "reviewing",
  APPROVED = "approved",
  WAITLISTED = "waitlisted",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  NO_SHOW = "no_show",
}

/**
 * Email log status
 */
export enum EmailStatus {
  PENDING = "pending",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Status transition validation
 */
export function canTransition(
  currentStatus: string,
  newStatus: string,
  entityType: "budget" | "purchase_request" | "refund" | "application"
): boolean {
  const transitions: Record<string, Record<string, string[]>> = {
    budget: {
      draft: ["submitted", "rejected"],
      submitted: ["reviewing", "approved", "rejected"],
      reviewing: ["revision_requested", "approved", "rejected"],
      revision_requested: ["submitted"],
      approved: [],
      rejected: [],
    },
    purchase_request: {
      draft: ["submitted", "rejected"],
      submitted: ["reviewing", "approved", "rejected"],
      reviewing: ["approved", "rejected"],
      approved: ["purchase_completed"],
      purchase_completed: ["proof_submitted"],
      proof_submitted: ["proof_approved", "proof_rejected"],
      proof_approved: ["completed"],
      proof_rejected: ["proof_submitted"],
      completed: [],
      rejected: [],
    },
    refund: {
      draft: ["submitted", "rejected"],
      submitted: ["reviewing", "approved", "rejected"],
      reviewing: ["revision_requested", "approved", "rejected"],
      revision_requested: ["submitted"],
      approved: ["processing"],
      processing: ["completed"],
      completed: [],
      rejected: [],
    },
    application: {
      draft: ["submitted", "cancelled"],
      submitted: ["reviewing", "approved", "waitlisted", "rejected", "cancelled"],
      reviewing: ["approved", "waitlisted", "rejected"],
      approved: ["completed", "no_show"],
      waitlisted: ["approved", "rejected"],
      rejected: [],
      cancelled: [],
      completed: [],
      no_show: [],
    },
  }

  const allowed = transitions[entityType]?.[currentStatus] || []
  return allowed.includes(newStatus)
}
