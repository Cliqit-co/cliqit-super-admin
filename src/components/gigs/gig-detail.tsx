"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { GigSlotForm } from "@/components/gigs/gig-slot-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  updateGig,
  setGigStatus,
  softDeleteGig,
  upsertSlot,
  deleteSlot,
  recomputeSlotCapacity,
} from "@/data/gigs"
import { formatDate, formatDateTime } from "@/lib/utils"
import { Pencil, Trash2, RefreshCw, Plus } from "lucide-react"
import type { GigDetail, GigSlot, GigStatus, UpsertSlotPayload } from "@/data/gigs"

interface GigDetailProps {
  gig: GigDetail
  onRefresh: () => void
}

interface OverviewFormValues {
  title: string
  description: string
  category: string
  city: string
  venue_address: string
  content_instructions: string
  restrictions: string
  currency: string
  compensation_amount: string
}

export function GigDetailView({ gig, onRefresh }: GigDetailProps) {
  // Status change confirm
  const [statusTarget, setStatusTarget] = React.useState<GigStatus | null>(null)
  const [statusLoading, setStatusLoading] = React.useState(false)

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  // Slot form dialog
  const [slotDialogOpen, setSlotDialogOpen] = React.useState(false)
  const [editingSlot, setEditingSlot] = React.useState<GigSlot | undefined>(undefined)

  // Slot delete confirm
  const [deletingSlotId, setDeletingSlotId] = React.useState<string | null>(null)
  const [slotDeleteLoading, setSlotDeleteLoading] = React.useState(false)

  // Overview form
  const [editMode, setEditMode] = React.useState(false)
  const [saveLoading, setSaveLoading] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<OverviewFormValues>({
    defaultValues: {
      title: gig.title,
      description: gig.description ?? "",
      category: gig.category ?? "",
      city: gig.city ?? "",
      venue_address: gig.venueAddress ?? "",
      content_instructions: gig.contentInstructions ?? "",
      restrictions: gig.restrictions ?? "",
      currency: gig.currency ?? "USD",
      compensation_amount:
        gig.compensationAmount != null ? String(gig.compensationAmount) : "",
    },
  })

  function handleEditCancel() {
    reset()
    setEditMode(false)
    setSaveError(null)
  }

  async function onOverviewSubmit(values: OverviewFormValues) {
    setSaveLoading(true)
    setSaveError(null)
    try {
      const patch: Parameters<typeof updateGig>[1] = {
        title: values.title,
        description: values.description || undefined,
        category: values.category || undefined,
        city: values.city || undefined,
        venue_address: values.venue_address || undefined,
        content_instructions: values.content_instructions || undefined,
        restrictions: values.restrictions || undefined,
        currency: values.currency || undefined,
        compensation_amount:
          values.compensation_amount !== ""
            ? parseFloat(values.compensation_amount)
            : null,
      }
      await updateGig(gig.id, patch)
      setEditMode(false)
      onRefresh()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleStatusChange(status: GigStatus) {
    setStatusLoading(true)
    try {
      await setGigStatus(gig.id, status)
      setStatusTarget(null)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await softDeleteGig(gig.id)
      setDeleteOpen(false)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSlotUpsert(payload: UpsertSlotPayload) {
    await upsertSlot(payload)
    setSlotDialogOpen(false)
    setEditingSlot(undefined)
    onRefresh()
  }

  function openAddSlot() {
    setEditingSlot(undefined)
    setSlotDialogOpen(true)
  }

  function openEditSlot(slot: GigSlot) {
    setEditingSlot(slot)
    setSlotDialogOpen(true)
  }

  async function handleDeleteSlot() {
    if (!deletingSlotId) return
    setSlotDeleteLoading(true)
    try {
      await deleteSlot(deletingSlotId)
      setDeletingSlotId(null)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSlotDeleteLoading(false)
    }
  }

  async function handleRecomputeSlot(slotId: string) {
    try {
      await recomputeSlotCapacity(slotId)
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const showAmount =
    gig.compensationType !== "freebie" && gig.compensationType !== "barter"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{gig.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            by {gig.businessName ?? "Unknown"} · Created {formatDate(gig.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={gig.status} />
          {gig.deletedAt && (
            <Badge variant="destructive">Deleted</Badge>
          )}
          <Select
            value={gig.status}
            onValueChange={(val) => {
              const s = val as GigStatus
              if (s === "active") {
                setStatusTarget(s)
              } else {
                setStatusTarget(s)
              }
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {!gig.deletedAt && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Gig
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="slots">Slots ({gig.slots.length})</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({gig.applications.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          {!editMode ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Status" value={<StatusBadge status={gig.status} />} />
                <Field label="Compensation Type" value={<StatusBadge status={gig.compensationType} />} />
                {showAmount && (
                  <Field
                    label="Amount"
                    value={
                      gig.compensationAmount != null
                        ? `${gig.currency ?? "USD"} ${gig.compensationAmount}`
                        : "N/A"
                    }
                  />
                )}
                <Field label="City" value={gig.city ?? "—"} />
                <Field label="Venue" value={gig.venueAddress ?? "—"} />
                <Field label="Category" value={gig.category ?? "—"} />
                <Field label="Content Type" value={gig.contentType ?? "—"} />
                <Field label="Application Deadline" value={gig.applicationDeadline ? formatDate(gig.applicationDeadline) : "—"} />
                <Field label="Created" value={formatDateTime(gig.createdAt)} />
                <Field label="Updated" value={formatDateTime(gig.updatedAt)} />
              </div>
              {gig.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{gig.description}</p>
                </div>
              )}
              {gig.contentInstructions && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Content Instructions
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{gig.contentInstructions}</p>
                </div>
              )}
              {gig.restrictions && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Restrictions
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{gig.restrictions}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onOverviewSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...register("title", { required: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" {...register("category")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="venue_address">Venue Address</Label>
                  <Input id="venue_address" {...register("venue_address")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" {...register("currency")} placeholder="USD" />
                </div>
                {showAmount && (
                  <div className="space-y-1">
                    <Label htmlFor="compensation_amount">Compensation Amount</Label>
                    <Input
                      id="compensation_amount"
                      type="number"
                      step="0.01"
                      {...register("compensation_amount")}
                    />
                  </div>
                )}
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={3} {...register("description")} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="content_instructions">Content Instructions</Label>
                  <Textarea id="content_instructions" rows={3} {...register("content_instructions")} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="restrictions">Restrictions</Label>
                  <Textarea id="restrictions" rows={2} {...register("restrictions")} />
                </div>
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleEditCancel} disabled={saveLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveLoading}>
                  {saveLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </TabsContent>

        {/* Slots Tab */}
        <TabsContent value="slots" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={openAddSlot}>
                <Plus className="h-4 w-4 mr-1" /> Add Slot
              </Button>
            </div>
            {gig.slots.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No slots yet.</p>
            ) : (
              <div className="space-y-3">
                {gig.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between border rounded-lg p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatDateTime(slot.slotStart)} → {formatDateTime(slot.slotEnd)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Capacity: {slot.capacity}
                        {slot.capacityReached && (
                          <span className="ml-2 text-orange-600 font-medium">Full</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Recompute capacity"
                        onClick={() => handleRecomputeSlot(slot.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit slot"
                        onClick={() => openEditSlot(slot)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete slot"
                        onClick={() => setDeletingSlotId(slot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4">
          {gig.applications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {gig.applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {app.influencerName ?? app.influencerId}
                    </p>
                    {app.applicationMessage && (
                      <p className="text-xs text-gray-500 mt-0.5 max-w-md truncate">
                        {app.applicationMessage}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Applied: {app.appliedAt ? formatDate(app.appliedAt) : "—"}
                      {app.slotId && " · Has slot"}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Status Change Confirm */}
      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(o) => { if (!o) setStatusTarget(null) }}
        title={statusTarget === "active" ? "Activate Gig" : `Set status to "${statusTarget}"`}
        description={
          statusTarget === "active"
            ? "Setting this gig to active will send push notifications to eligible influencers."
            : `Are you sure you want to set this gig to "${statusTarget}"?`
        }
        confirmLabel={statusTarget === "active" ? "Activate & Notify" : "Confirm"}
        loading={statusLoading}
        onConfirm={() => statusTarget && handleStatusChange(statusTarget)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Gig"
        description="This will hide the gig from all users. This action can be reversed by clearing the deleted_at timestamp."
        confirmLabel="Delete"
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
      />

      {/* Slot Form Dialog */}
      <Dialog
        open={slotDialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setSlotDialogOpen(false)
            setEditingSlot(undefined)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Slot" : "Add Slot"}</DialogTitle>
          </DialogHeader>
          <GigSlotForm
            gigId={gig.id}
            slot={editingSlot}
            onSubmit={handleSlotUpsert}
            onCancel={() => {
              setSlotDialogOpen(false)
              setEditingSlot(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Slot Delete Confirm */}
      <ConfirmDialog
        open={deletingSlotId !== null}
        onOpenChange={(o) => { if (!o) setDeletingSlotId(null) }}
        title="Delete Slot"
        description="Are you sure you want to delete this slot? This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={slotDeleteLoading}
        onConfirm={handleDeleteSlot}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="mt-0.5 text-sm text-gray-900">{value}</div>
    </div>
  )
}
