"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GigSlot, UpsertSlotPayload } from "@/data/gigs"

interface GigSlotFormProps {
  gigId: string
  slot?: GigSlot
  onSubmit: (payload: UpsertSlotPayload) => Promise<void>
  onCancel: () => void
}

interface SlotFormValues {
  slot_start: string
  slot_end: string
  capacity: number
}

export function GigSlotForm({ gigId, slot, onSubmit, onCancel }: GigSlotFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Convert ISO to local datetime-local input format
  function toLocalInput(iso: string | undefined): string {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const { register, handleSubmit, formState: { errors } } = useForm<SlotFormValues>({
    defaultValues: {
      slot_start: toLocalInput(slot?.slotStart),
      slot_end: toLocalInput(slot?.slotEnd),
      capacity: slot?.capacity ?? 1,
    },
  })

  const isEditing = !!slot

  async function onFormSubmit(values: SlotFormValues) {
    setError(null)
    setLoading(true)
    try {
      const payload: UpsertSlotPayload = {
        gig_id: gigId,
        slot_start: new Date(values.slot_start).toISOString(),
        slot_end: new Date(values.slot_end).toISOString(),
        capacity: Number(values.capacity),
      }
      if (isEditing && slot?.id) {
        payload.id = slot.id
      }
      await onSubmit(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save slot")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="slot_start">Start Date &amp; Time</Label>
        <Input
          id="slot_start"
          type="datetime-local"
          {...register("slot_start", { required: "Start time is required" })}
        />
        {errors.slot_start && (
          <p className="text-xs text-red-600">{errors.slot_start.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="slot_end">End Date &amp; Time</Label>
        <Input
          id="slot_end"
          type="datetime-local"
          {...register("slot_end", { required: "End time is required" })}
        />
        {errors.slot_end && (
          <p className="text-xs text-red-600">{errors.slot_end.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          {...register("capacity", {
            required: "Capacity is required",
            min: { value: 1, message: "Capacity must be at least 1" },
            valueAsNumber: true,
          })}
        />
        {errors.capacity && (
          <p className="text-xs text-red-600">{errors.capacity.message}</p>
        )}
        {isEditing && (
          <p className="text-xs text-yellow-600">
            Note: Lowering capacity does not automatically reject existing approved applications.
          </p>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Slot" : "Add Slot"}
        </Button>
      </div>
    </form>
  )
}
