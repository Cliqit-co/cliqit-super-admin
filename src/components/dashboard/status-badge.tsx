import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  className?: string
}

const statusConfig = {
  // User statuses
  active: { variant: "success" as const, label: "Active" },
  inactive: { variant: "secondary" as const, label: "Inactive" },
  suspended: { variant: "destructive" as const, label: "Suspended" },
  pending: { variant: "warning" as const, label: "Pending" },
  
  // Application statuses
  accepted: { variant: "success" as const, label: "Accepted" },
  rejected: { variant: "destructive" as const, label: "Rejected" },
  under_review: { variant: "warning" as const, label: "Under Review" },
  withdrawn: { variant: "secondary" as const, label: "Withdrawn" },
  
  // Vetting statuses
  approved: { variant: "success" as const, label: "Approved" },
  verified: { variant: "success" as const, label: "Verified" },
  unverified: { variant: "secondary" as const, label: "Unverified" },
  email_verified: { variant: "success" as const, label: "Email Verified" },
  email_unverified: { variant: "warning" as const, label: "Email Unverified" },
  terms_accepted: { variant: "success" as const, label: "Terms Accepted" },
  terms_missing: { variant: "warning" as const, label: "Terms Missing" },
  privacy_accepted: { variant: "success" as const, label: "Privacy Accepted" },
  privacy_missing: { variant: "warning" as const, label: "Privacy Missing" },
  
  // Gig statuses
  draft: { variant: "secondary" as const, label: "Draft" },
  completed: { variant: "success" as const, label: "Completed" },
  cancelled: { variant: "destructive" as const, label: "Cancelled" },
  
  // Event statuses
  upcoming: { variant: "info" as const, label: "Upcoming" },
  ongoing: { variant: "warning" as const, label: "Ongoing" },
  
  // RSVP statuses
  going: { variant: "success" as const, label: "Going" },
  not_going: { variant: "destructive" as const, label: "Not Going" },
  maybe: { variant: "warning" as const, label: "Maybe" },
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    variant: "default" as const,
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
  }

  return (
    <Badge
      variant={variant || config.variant}
      className={cn("", className)}
    >
      {config.label}
    </Badge>
  )
}
