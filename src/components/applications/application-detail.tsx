"use client"

import * as React from "react"
import { RemoteAvatar } from "@/components/remote-avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApplicationStatusControl } from "./application-status-control"
import { formatDate, formatDateTime } from "@/lib/utils"
import type { ApplicationDetail, ApplicationStatus } from "@/data/applications"
import {
  User,
  Building2,
  Target,
  Clock,
  Mail,
  Phone,
  Calendar,
  Hash,
  MessageSquare,
} from "lucide-react"

interface ApplicationDetailProps {
  application: ApplicationDetail
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-gray-900">{value ?? <span className="text-gray-400 italic">—</span>}</div>
      </div>
    </div>
  )
}

export function ApplicationDetailView({ application }: ApplicationDetailProps) {
  const [currentStatus, setCurrentStatus] = React.useState<ApplicationStatus>(
    application.status,
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column — main details */}
      <div className="lg:col-span-2 space-y-5">
        {/* Influencer card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Influencer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 mb-4">
              <RemoteAvatar
                src={application.influencerAvatar}
                alt={application.influencerName ?? "Influencer"}
                size={48}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {application.influencerName ?? <span className="text-gray-400 italic">Unknown</span>}
                </p>
                <p className="text-xs text-gray-500 font-mono">{application.influencerId}</p>
              </div>
            </div>
            <DetailRow icon={Mail} label="Email" value={application.influencerEmail} />
            <DetailRow icon={Phone} label="Phone" value={application.influencerPhone} />
          </CardContent>
        </Card>

        {/* Business & Target */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-500" />
              Business &amp; Target
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailRow
              icon={Building2}
              label="Business"
              value={application.businessName ?? application.businessId}
            />
            <DetailRow
              icon={Target}
              label="Target"
              value={
                <div className="flex items-center gap-2">
                  <span>{application.targetTitle ?? application.targetId}</span>
                  <Badge
                    variant={application.targetType === "gig" ? "default" : "info"}
                    className="text-[10px] py-0 px-1.5"
                  >
                    {application.targetType}
                  </Badge>
                </div>
              }
            />
            {/* Only show slot info for gig applications */}
            {application.targetType === "gig" && (
              <DetailRow
                icon={Hash}
                label="Slot ID"
                value={
                  application.slotId ? (
                    <span className="font-mono text-xs">{application.slotId}</span>
                  ) : null
                }
              />
            )}
            {/* Checkin only meaningful for events */}
            {application.targetType === "event" && application.checkinAt && (
              <DetailRow
                icon={Calendar}
                label="Checked in at"
                value={formatDateTime(application.checkinAt)}
              />
            )}
          </CardContent>
        </Card>

        {/* Application message */}
        {application.applicationMessage && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                Application Message
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {application.applicationMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DetailRow icon={Clock} label="Applied at" value={formatDateTime(application.appliedAt)} />
            {application.startedAt && (
              <DetailRow icon={Clock} label="Started at" value={formatDateTime(application.startedAt)} />
            )}
            {application.statusChangedAt && (
              <DetailRow
                icon={Clock}
                label="Status changed at"
                value={formatDateTime(application.statusChangedAt)}
              />
            )}
            <DetailRow icon={Clock} label="Created" value={formatDate(application.createdAt)} />
            <DetailRow icon={Clock} label="Last updated" value={formatDateTime(application.updatedAt)} />
          </CardContent>
        </Card>
      </div>

      {/* Right column — status management */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <StatusBadge status={currentStatus} className="text-sm" />
            <ApplicationStatusControl
              applicationId={application.id}
              currentStatus={currentStatus}
              onStatusChanged={setCurrentStatus}
            />
          </CardContent>
        </Card>

        {/* Application ID card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Application ID</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs font-mono text-gray-700 break-all">{application.id}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
