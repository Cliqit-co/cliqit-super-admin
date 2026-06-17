// Authoritative enum types — derived from 0002_enums.sql + 0099
// DO NOT import from src/types/application.ts (stale)

export type UserRole = "superAdmin" | "business" | "influencer"

export type GigStatus = "draft" | "active" | "completed" | "cancelled"

export type EventStatus =
  | "draft"
  | "active"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"

export type ApplicationStatus =
  | "applied"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "started"
  | "verification_pending"
  | "completed"
  | "cancelled"

export type ContentSubmissionStatus = "pending_review" | "completed" | "rejected"

export type CompensationType = "freebie" | "paid" | "per_day" | "flat" | "barter"

export type SlotChangeStatus = "pending" | "approved" | "rejected" | "cancelled"

export type MessageType = "text" | "image" | "file"

export type ChatConversationStatus = "active" | "archived"

export type NotificationType =
  | "user_notification"
  | "influencer_approved"
  | "influencer_rejected"
  | "vetting_approved"
  | "application_status_update"
  | "new_message"
  | "new_gig_broadcast"
  | "event_reminder"
  | "test"

export type TargetType = "gig" | "event"

// Valid application status transitions (from is_valid_application_transition SQL)
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["approved", "rejected", "withdrawn", "cancelled"],
  approved: ["started", "rejected", "cancelled", "withdrawn"],
  started: ["verification_pending", "cancelled"],
  verification_pending: ["completed", "rejected"],
  // Terminal states
  completed: [],
  rejected: [],
  withdrawn: [],
  cancelled: [],
}

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from]?.includes(to) ?? false
}
