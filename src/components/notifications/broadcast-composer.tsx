"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { NotificationService } from "@/lib/notification-service"
import { resolveAudience, countAudience } from "@/data/audience"
import type { AudienceTarget } from "@/data/audience"
import { Plus, Trash2, Send, Users } from "lucide-react"

const schema = z.object({
  audienceType: z.enum([
    "all_users",
    "all_influencers",
    "all_businesses",
    "specific_user",
    "filtered_influencers",
  ]),
  specificUserId: z.string().optional(),
  filteredVerified: z.boolean().optional(),
  filteredCity: z.string().optional(),
  filteredNiche: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  dataFields: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
})

type FormValues = z.infer<typeof schema>

type SendProgress = {
  currentChunk: number
  totalChunks: number
  succeeded: number
  failed: number
  noToken: number
  done: boolean
}

export function BroadcastComposer() {
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)
  const [countError, setCountError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [progress, setProgress] = useState<SendProgress | null>(null)
  const [sendLoading, setSendLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      audienceType: "all_users",
      dataFields: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "dataFields",
  })

  const audienceType = watch("audienceType")

  function buildTarget(values: FormValues): AudienceTarget {
    if (values.audienceType === "specific_user") {
      return { type: "specific_user", userId: values.specificUserId ?? "" }
    }
    if (values.audienceType === "filtered_influencers") {
      return {
        type: "filtered_influencers",
        verified: values.filteredVerified,
        city: values.filteredCity || undefined,
        niche: values.filteredNiche || undefined,
      }
    }
    // audienceType is a simple variant with no extra fields
    const t = values.audienceType as "all_users" | "all_influencers" | "all_businesses"
    return { type: t } as AudienceTarget
  }

  async function handlePreviewCount() {
    const values = watch()
    if (!values.audienceType) return
    setCountLoading(true)
    setCountError(null)
    try {
      const target = buildTarget(values)
      const count = await countAudience(target)
      setAudienceCount(count)
    } catch (e) {
      setCountError(e instanceof Error ? e.message : "Failed to count audience")
    } finally {
      setCountLoading(false)
    }
  }

  function onSubmitForm() {
    void handlePreviewCount().then(() => {
      setConfirmOpen(true)
    })
  }

  async function handleConfirmSend() {
    const values = watch()
    setConfirmOpen(false)
    setSendLoading(true)

    const extraData: Record<string, string> = {}
    for (const field of values.dataFields ?? []) {
      if (field.key) extraData[field.key] = field.value
    }

    const payload = {
      title: values.title,
      body: values.body,
      data: Object.keys(extraData).length > 0 ? extraData : undefined,
    }

    try {
      const target = buildTarget(values)
      const userIds = await resolveAudience(target)
      const CHUNK_SIZE = 100
      const chunks: string[][] = []
      for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
        chunks.push(userIds.slice(i, i + CHUNK_SIZE))
      }

      let totalSucceeded = 0
      let totalFailed = 0
      let totalNoToken = 0

      setProgress({
        currentChunk: 0,
        totalChunks: chunks.length,
        succeeded: 0,
        failed: 0,
        noToken: 0,
        done: false,
      })

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const result = await NotificationService.sendNotificationToMultipleUsers(chunk, payload)

        totalSucceeded += result.success.length

        // Distinguish no-device-token errors from real errors
        for (const r of result.results) {
          if (!r.success) {
            const isNoToken =
              r.error?.toLowerCase().includes("no device") ||
              r.error?.toLowerCase().includes("no token") ||
              r.error?.toLowerCase().includes("no devices")
            if (isNoToken) {
              totalNoToken++
            } else {
              totalFailed++
            }
          }
        }

        setProgress({
          currentChunk: i + 1,
          totalChunks: chunks.length,
          succeeded: totalSucceeded,
          failed: totalFailed,
          noToken: totalNoToken,
          done: i === chunks.length - 1,
        })
      }
    } catch (e) {
      console.error("Broadcast send error:", e)
    } finally {
      setSendLoading(false)
    }
  }

  const currentCount = audienceCount ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Broadcast Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            {/* Audience */}
            <div className="space-y-4">
              <Label>Audience</Label>
              <Select
                value={audienceType}
                onValueChange={(v) =>
                  setValue("audienceType", v as FormValues["audienceType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_users">All Users</SelectItem>
                  <SelectItem value="all_influencers">All Influencers</SelectItem>
                  <SelectItem value="all_businesses">All Businesses</SelectItem>
                  <SelectItem value="specific_user">Specific User</SelectItem>
                  <SelectItem value="filtered_influencers">Filtered Influencers</SelectItem>
                </SelectContent>
              </Select>

              {audienceType === "specific_user" && (
                <div className="space-y-1">
                  <Label>User ID</Label>
                  <Input
                    placeholder="Enter user UUID..."
                    {...register("specificUserId")}
                  />
                </div>
              )}

              {audienceType === "filtered_influencers" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Verified</Label>
                    <Select
                      onValueChange={(v) => {
                        if (v === "any") setValue("filteredVerified", undefined)
                        else setValue("filteredVerified", v === "true")
                      }}
                      defaultValue="any"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Verified only</SelectItem>
                        <SelectItem value="false">Unverified only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Input placeholder="e.g. Dubai" {...register("filteredCity")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Niche</Label>
                    <Input placeholder="e.g. Fashion" {...register("filteredNiche")} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewCount}
                  disabled={countLoading}
                >
                  <Users className="h-4 w-4 mr-1" />
                  {countLoading ? "Counting..." : "Preview audience count"}
                </Button>
                {audienceCount !== null && (
                  <Badge variant="secondary">{audienceCount.toLocaleString()} users</Badge>
                )}
                {countError && (
                  <span className="text-sm text-red-600">{countError}</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label>Title</Label>
              <Input placeholder="Notification title..." {...register("title")} />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label>Body</Label>
              <Textarea
                placeholder="Notification body..."
                rows={3}
                {...register("body")}
              />
              {errors.body && (
                <p className="text-sm text-red-600">{errors.body.message}</p>
              )}
            </div>

            {/* Extra data fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Extra Data (optional key/value pairs)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", value: "" })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add field
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="key"
                    {...register(`dataFields.${index}.key`)}
                  />
                  <Input
                    placeholder="value"
                    {...register(`dataFields.${index}.value`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={sendLoading}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Review & Send
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Progress */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Send Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!progress.done ? (
              <p className="text-sm text-muted-foreground">
                Sending chunk {progress.currentChunk} of {progress.totalChunks}...
              </p>
            ) : (
              <p className="text-sm font-medium text-green-700">Send complete.</p>
            )}
            <div className="flex gap-4 text-sm">
              <span className="text-green-700 font-medium">
                {progress.succeeded} succeeded
              </span>
              <span className="text-red-600 font-medium">
                {progress.failed} failed
              </span>
              <span className="text-yellow-600 font-medium">
                {progress.noToken} no device token
              </span>
            </div>
            {progress.done && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <strong>Summary:</strong> {progress.succeeded} sent successfully,{" "}
                {progress.failed} failed (real errors),{" "}
                {progress.noToken} skipped (no device token registered).
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Send to ${currentCount.toLocaleString()} users?`}
        description="This will send real push notifications to the selected audience. This action cannot be undone."
        confirmLabel="Send Notifications"
        onConfirm={() => void handleConfirmSend()}
      />
    </div>
  )
}
