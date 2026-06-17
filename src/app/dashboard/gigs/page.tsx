"use client"

import * as React from "react"
import { DataTable } from "@/components/tables/data-table"
import { getGigsColumns } from "@/components/gigs/gigs-columns"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { fetchGigs, setGigStatus, softDeleteGig } from "@/data/gigs"
import { debounce } from "@/lib/utils"
import type { Gig, GigStatus } from "@/data/gigs"

export default function GigsPage() {
  const [gigs, setGigs] = React.useState<Gig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<GigStatus | "">("")
  const [compFilter, setCompFilter] = React.useState<string>("")

  // Status change confirm state
  const [pendingStatus, setPendingStatus] = React.useState<{
    gig: Gig
    status: GigStatus
  } | null>(null)
  const [statusLoading, setStatusLoading] = React.useState(false)

  // Delete confirm state
  const [pendingDelete, setPendingDelete] = React.useState<Gig | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  async function load(params: { search?: string; status?: GigStatus | ""; comp?: string }) {
    setLoading(true)
    try {
      const data = await fetchGigs({
        search: params.search || undefined,
        status: (params.status as GigStatus) || undefined,
        compensationType: params.comp as never || undefined,
      })
      setGigs(data)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  const debouncedLoad = React.useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const s = args[0] as string
        load({ search: s, status: statusFilter, comp: compFilter })
      }, 300),
    [statusFilter, compFilter]
  )

  React.useEffect(() => {
    load({ search, status: statusFilter, comp: compFilter })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, compFilter])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    debouncedLoad(e.target.value)
  }

  function handleSetStatus(gig: Gig, status: GigStatus) {
    setPendingStatus({ gig, status })
  }

  function handleDelete(gig: Gig) {
    setPendingDelete(gig)
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return
    setStatusLoading(true)
    try {
      await setGigStatus(pendingStatus.gig.id, pendingStatus.status)
      setPendingStatus(null)
      load({ search, status: statusFilter, comp: compFilter })
    } catch (err) {
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      await softDeleteGig(pendingDelete.id)
      setPendingDelete(null)
      load({ search, status: statusFilter, comp: compFilter })
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = React.useMemo(
    () =>
      getGigsColumns({
        onSetStatus: handleSetStatus,
        onDelete: handleDelete,
      }),
  []
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gigs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all gigs on the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-xs"
        />
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v as GigStatus))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={compFilter || "all"}
          onValueChange={(v) => setCompFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All comp. types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All comp. types</SelectItem>
            <SelectItem value="freebie">Freebie</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="per_day">Per Day</SelectItem>
            <SelectItem value="flat">Flat</SelectItem>
            <SelectItem value="barter">Barter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-12 text-center">Loading gigs...</div>
      ) : (
        <DataTable
          columns={columns}
          data={gigs}
          searchPlaceholder="Filter by title..."
        />
      )}

      {/* Status change confirm */}
      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(o) => { if (!o) setPendingStatus(null) }}
        title={
          pendingStatus?.status === "active"
            ? "Activate Gig"
            : `Change status to "${pendingStatus?.status}"`
        }
        description={
          pendingStatus?.status === "active"
            ? `Setting "${pendingStatus?.gig.title}" to active will send push notifications to eligible influencers.`
            : `Change "${pendingStatus?.gig.title}" to "${pendingStatus?.status}"?`
        }
        confirmLabel={pendingStatus?.status === "active" ? "Activate & Notify" : "Confirm"}
        loading={statusLoading}
        onConfirm={confirmStatusChange}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null) }}
        title="Delete Gig"
        description={`This will hide "${pendingDelete?.title}" from all users.`}
        confirmLabel="Delete"
        destructive
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
