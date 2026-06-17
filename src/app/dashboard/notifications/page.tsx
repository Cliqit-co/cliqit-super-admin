import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { NotificationTestPanel } from "@/components/dashboard/notification-test-panel"
import { BroadcastComposer } from "@/components/notifications/broadcast-composer"
import NotificationHistoryPage from "./history/page"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Broadcast, test, and review push notifications
        </p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <BroadcastComposer />
        </TabsContent>

        <TabsContent value="test">
          <NotificationTestPanel />
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistoryPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
