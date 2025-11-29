import { NotificationTestPanel } from "@/components/dashboard/notification-test-panel"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Test and manage push notifications for users
        </p>
      </div>

      <NotificationTestPanel />
    </div>
  )
}

