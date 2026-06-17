"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  Building2,
  Briefcase,
  Calendar,
  FileText,
  ArrowLeftRight,
  Image,
  MessageSquare,
  MessagesSquare,
  Bell,
  History,
  Shield,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { resolveStorageUrl } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { RemoteAvatar } from "@/components/remote-avatar"

const navigation = {
  overview: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ],
  people: [
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Influencer Review", href: "/dashboard/influencers/vetting", icon: UserCheck },
    { name: "Businesses", href: "/dashboard/businesses", icon: Building2 },
  ],
  marketplace: [
    { name: "Gigs", href: "/dashboard/gigs", icon: Briefcase },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Applications", href: "/dashboard/applications", icon: FileText },
    { name: "Slot Changes", href: "/dashboard/requests/slot-changes", icon: ArrowLeftRight },
  ],
  contentCommunity: [
    { name: "Content", href: "/dashboard/content", icon: Image },
    { name: "Community", href: "/dashboard/community", icon: MessageSquare },
  ],
  operations: [
    { name: "Support / Chats", href: "/dashboard/chats", icon: MessagesSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Notification History", href: "/dashboard/notifications/history", icon: History },
    { name: "Audit Log", href: "/dashboard/audit", icon: Shield },
  ],
}

const sectionLabels: Record<keyof typeof navigation, string> = {
  overview: "Overview",
  people: "People",
  marketplace: "Marketplace",
  contentCommunity: "Content & Community",
  operations: "Operations",
}

interface NavUser {
  displayName: string | null
  avatarUrl: string | null
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<NavUser | null>(null)

  React.useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        const { data } = await supabase
          .from("users_public")
          .select("display_name, avatar_url")
          .eq("id", authUser.id)
          .single()
        if (data) {
          setUser({
            displayName: data.display_name ?? null,
            avatarUrl: resolveStorageUrl(data.avatar_url ?? undefined),
          })
        }
      } catch {
        // silently fail
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/sign-in")
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Cliqit</h1>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {(Object.keys(navigation) as Array<keyof typeof navigation>).map((section) => (
          <div key={section}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {sectionLabels[section]}
            </p>
            <div className="space-y-0.5">
              {navigation[section].map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-4 w-4 shrink-0",
                        active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <RemoteAvatar
            src={user?.avatarUrl ?? undefined}
            alt={user?.displayName ?? "Admin"}
            size={32}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName ?? "Super Admin"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
