"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/tables/data-table"
import { businessColumns } from "@/components/businesses/businesses-columns"
import { fetchBusinesses, type BusinessProfile } from "@/data/businesses"
import { downloadCsv, jsonToCsv } from "@/lib/csv"
import { Building2, CheckCircle, ShieldOff, Users } from "lucide-react"

export default function BusinessesPage() {
  const [data, setData] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all")

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchBusinesses()
      .then((rows) => {
        if (!mounted) return
        setData(rows)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load businesses")
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  // Derived filter options
  const categoryOptions = useMemo(() => {
    const s = new Set<string>()
    for (const b of data) {
      if (b.category) s.add(b.category)
    }
    return Array.from(s).sort()
  }, [data])

  const cityOptions = useMemo(() => {
    const s = new Set<string>()
    for (const b of data) {
      if (b.city) s.add(b.city)
    }
    return Array.from(s).sort()
  }, [data])

  // Filtered data
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return data.filter((b) => {
      if (s) {
        const hay = [b.businessName, b.email, b.city, b.category].join(" ").toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (categoryFilter && b.category !== categoryFilter) return false
      if (cityFilter && b.city !== cityFilter) return false
      if (verifiedFilter === "verified" && !b.verifiedAt) return false
      if (verifiedFilter === "unverified" && !!b.verifiedAt) return false
      if (statusFilter === "active" && !!b.userDeletedAt) return false
      if (statusFilter === "suspended" && !b.userDeletedAt) return false
      return true
    })
  }, [data, search, categoryFilter, cityFilter, verifiedFilter, statusFilter])

  // Stats
  const totalCount = data.length
  const verifiedCount = data.filter((b) => !!b.verifiedAt).length
  const suspendedCount = data.filter((b) => !!b.userDeletedAt).length

  function handleExport() {
    try {
      const rows = filtered.map((b) => ({
        userId: b.userId,
        businessName: b.businessName ?? "",
        category: b.category ?? "",
        city: b.city ?? "",
        state: b.state ?? "",
        email: b.email ?? "",
        phoneNumber: b.phoneNumber ?? "",
        verified: b.verifiedAt ? "Yes" : "No",
        verifiedAt: b.verifiedAt ?? "",
        suspended: b.userDeletedAt ? "Yes" : "No",
        joinedAt: b.createdAt,
      }))
      const csv = jsonToCsv(rows, {
        fields: [
          "userId", "businessName", "category", "city", "state",
          "email", "phoneNumber", "verified", "verifiedAt", "suspended", "joinedAt",
        ],
        headers: {
          userId: "User ID",
          businessName: "Business Name",
          category: "Category",
          city: "City",
          state: "State",
          email: "Email",
          phoneNumber: "Phone",
          verified: "Verified",
          verifiedAt: "Verified At",
          suspended: "Suspended",
          joinedAt: "Joined At",
        },
      })
      const ts = new Date().toISOString().replace(/[:.]/g, "-")
      downloadCsv(csv, `businesses-${ts}.csv`)
    } catch (err) {
      console.error("CSV export failed:", err)
    }
  }

  function handleClearFilters() {
    setSearch("")
    setCategoryFilter("")
    setCityFilter("")
    setVerifiedFilter("all")
    setStatusFilter("all")
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground">Manage business accounts, verification, and suspension</p>
        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <ShieldOff className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Search</label>
              <Input
                placeholder="Name, email, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All categories</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
              <select
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">All cities</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Verification</label>
              <select
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value as "all" | "verified" | "unverified")}
              >
                <option value="all">All</option>
                <option value="verified">Verified only</option>
                <option value="unverified">Unverified only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "suspended")}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear filters
            </Button>
            <Button size="sm" onClick={handleExport}>
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Business Accounts
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({filtered.length} of {totalCount})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div>
          ) : (
            <DataTable
              columns={businessColumns}
              data={filtered}
              searchPlaceholder="Filter by name..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
