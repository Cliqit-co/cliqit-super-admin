import { Sidebar } from "@/components/dashboard/sidebar"
import { RequireAuth } from "@/components/RequireAuth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
