"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CommunityPostCard } from "@/components/community/community-post-card"
import {
  fetchCommunityPosts,
  setPostVisibility,
  softDeletePost,
  restorePost,
  type CommunityPost,
  type FetchCommunityPostsParams,
} from "@/data/community"

type FilterTab = "all" | "visible" | "hidden" | "deleted"

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "deleted", label: "Deleted" },
]

const PAGE_SIZE = 20

export default function CommunityPage() {
  const router = useRouter()

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // action state
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState<{
    type: "hide" | "show" | "delete" | "restore"
    post: CommunityPost
  } | null>(null)

  const load = useCallback(
    async (params: FetchCommunityPostsParams, append = false) => {
      setLoading(true)
      setError(null)
      try {
        const rows = await fetchCommunityPosts(params)
        setPosts((prev) => (append ? [...prev, ...rows] : rows))
        setHasMore(rows.length === PAGE_SIZE)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Initial load and on filter/search change
  useEffect(() => {
    setPage(0)
    load({ filter, search: search || undefined, page: 0, limit: PAGE_SIZE })
  }, [filter, search, load])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    load(
      { filter, search: search || undefined, page: nextPage, limit: PAGE_SIZE },
      true
    )
  }

  const handleRefresh = () => {
    setPage(0)
    load({ filter, search: search || undefined, page: 0, limit: PAGE_SIZE })
  }

  // ── Action handlers (open confirm) ──────────────────────────────────────────

  const handleHide = (post: CommunityPost) => setConfirm({ type: "hide", post })
  const handleShow = (post: CommunityPost) => setConfirm({ type: "show", post })
  const handleDelete = (post: CommunityPost) => setConfirm({ type: "delete", post })
  const handleRestore = (post: CommunityPost) => setConfirm({ type: "restore", post })

  const handleConfirm = async () => {
    if (!confirm) return
    const { type, post } = confirm
    setActionLoading(true)
    try {
      if (type === "hide") {
        await setPostVisibility(post.id, false)
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, visibility: false, status: "hidden" as const } : p
          )
        )
      } else if (type === "show") {
        await setPostVisibility(post.id, true)
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, visibility: true, status: "visible" as const } : p
          )
        )
      } else if (type === "delete") {
        await softDeletePost(post.id)
        const deletedAt = new Date().toISOString()
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, deletedAt, status: "deleted" as const } : p
          )
        )
      } else if (type === "restore") {
        await restorePost(post.id)
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, deletedAt: null, visibility: true, status: "visible" as const }
              : p
          )
        )
      }
      setConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
      setConfirm(null)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Confirm dialog config ────────────────────────────────────────────────────

  const confirmConfig = confirm
    ? {
        hide: {
          title: "Hide post?",
          description: "The post will be hidden from users. You can restore visibility later.",
          confirmLabel: "Hide",
          destructive: false,
        },
        show: {
          title: "Show post?",
          description: "The post will become visible to all users.",
          confirmLabel: "Show",
          destructive: false,
        },
        delete: {
          title: "Delete post?",
          description:
            "The post will be soft-deleted and hidden from all users. You can restore it later.",
          confirmLabel: "Delete",
          destructive: true,
        },
        restore: {
          title: "Restore post?",
          description: "The post will be restored and made visible to users.",
          confirmLabel: "Restore",
          destructive: false,
        },
      }[confirm.type]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">Moderate community posts and comments.</p>
      </div>

      {/* Filter tabs + search + refresh */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Segmented filter tabs */}
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-3">
        {loading && posts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No posts found.</div>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onHide={handleHide}
              onShow={handleShow}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onClick={(p) => router.push(`/dashboard/community/${p.id}`)}
              loading={actionLoading}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && confirmConfig && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setConfirm(null)}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          destructive={confirmConfig.destructive}
          loading={actionLoading}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
