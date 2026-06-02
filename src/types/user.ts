export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  metadata?: Record<string, unknown>
}

export interface Influencer extends User {
  role: "influencer"
  // Personal Information from Signup
  phoneNumber?: string
  city: string
  audienceSize: AudienceSize
  niche: NicheCategory
  instagramUsername: string
  mailingListSubscribed: boolean
  
  // Social Media Profiles (expanded from signup)
  socialMedia: SocialMediaProfile[]
  followerCount: number
  engagementRate: number
  location: string
  languages: string[]
  
  // Vetting Information
  vettingStatus: VettingStatus
  vettingScore?: number
  vettingNotes?: string
  verifiedAt?: Date
  reviewedBy?: string
  reviewedAt?: Date
}

export interface Business extends User {
  role: "business"
  companyName: string
  industry: string
  companySize: CompanySize
  location: string
  website?: string
  verifiedAt?: Date
}

export type UserRole = "admin" | "moderator" | "influencer" | "business"
export type UserStatus = "active" | "inactive" | "suspended" | "pending"
export type VettingStatus = "pending" | "approved" | "rejected" | "under_review"
export type CompanySize = "startup" | "small" | "medium" | "large" | "enterprise"

// Influencer Signup Data Types
export type AudienceSize = 
  | "1K - 5K"
  | "5K - 10K" 
  | "10K - 25K"
  | "25K - 50K"
  | "50K - 100K"
  | "100K - 500K"
  | "500K - 1M"
  | "1M+"

export type NicheCategory = 
  | "Artist"
  | "Family"
  | "Tech"
  | "Gaming"
  | "Cinematography"
  | "Come With Me"
  | "Model"
  | "Pets & Animals"
  | "Lifestyle"
  | "Sports"
  | "Tiktoker"
  | "Fashion"
  | "Makeup"
  | "Foodie"
  | "Health & Beauty"

export type City = "Pune" | "Bangalore" | "Delhi" | "Mumbai"

export interface SocialMediaProfile {
  platform: SocialMediaPlatform
  username: string
  url: string
  followerCount: number
  engagementRate: number
  verified: boolean
}

export type SocialMediaPlatform = 
  | "instagram" 
  | "tiktok" 
  | "youtube" 
  | "twitter" 
  | "facebook" 
  | "linkedin" 
  | "twitch"

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  userGrowthRate: number
  averageSessionDuration: number
  topCountries: Array<{ country: string; count: number }>
  userRetentionRate: number
}
