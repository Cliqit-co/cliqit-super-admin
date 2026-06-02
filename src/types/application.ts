export interface Application {
  id: string
  userId: string
  gigId: string
  status: ApplicationStatus
  appliedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  notes?: string
  attachments?: string[]
  metadata?: Record<string, unknown>
}

export interface Gig {
  id: string
  title: string
  description: string
  businessId: string
  budget: number
  currency: string
  requirements: string[]
  deadline: Date
  status: GigStatus
  category: string
  location?: string
  createdAt: Date
  updatedAt: Date
  applicationCount: number
}

export interface Event {
  id: string
  title: string
  description: string
  businessId: string
  date: Date
  location: string
  capacity: number
  status: EventStatus
  category: string
  createdAt: Date
  updatedAt: Date
  rsvpCount: number
}

export interface RSVP {
  id: string
  eventId: string
  userId: string
  status: RSVPStatus
  rsvpAt: Date
  attendedAt?: Date
  notes?: string
}

export type ApplicationStatus = 
  | "pending" 
  | "under_review" 
  | "accepted" 
  | "rejected" 
  | "withdrawn"

export type GigStatus = 
  | "draft" 
  | "active" 
  | "paused" 
  | "completed" 
  | "cancelled"

export type EventStatus = 
  | "upcoming" 
  | "ongoing" 
  | "completed" 
  | "cancelled"

export type RSVPStatus = 
  | "going" 
  | "not_going" 
  | "maybe"

export interface ApplicationAnalytics {
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  averageResponseTime: number
  applicationSuccessRate: number
  topGigCategories: Array<{ category: string; count: number }>
  monthlyTrends: Array<{ month: string; applications: number; accepted: number }>
}

export interface FraudDetection {
  suspiciousApplications: number
  duplicateApplications: number
  fakeProfiles: number
  flaggedUsers: number
  riskScore: number
}
