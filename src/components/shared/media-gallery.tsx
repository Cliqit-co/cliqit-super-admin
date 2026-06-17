"use client"

import * as React from "react"
import { resolveStorageUrl } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface MediaGalleryProps {
  urls: (string | null | undefined)[]
  className?: string
}

export function MediaGallery({ urls, className }: MediaGalleryProps) {
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null)

  const resolved = urls
    .map((u) => resolveStorageUrl(u ?? undefined))
    .filter((u): u is string => !!u)

  if (!resolved.length) return null

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {resolved.map((src, i) => (
          <div
            key={i}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-200 cursor-pointer bg-gray-100"
            onClick={() => setLightboxSrc(src)}
          >
            <img
              src={src}
              alt={`media-${i}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = "none"
                const parent = target.parentElement
                if (parent) {
                  parent.classList.add("flex", "items-center", "justify-center")
                  const placeholder = document.createElement("span")
                  placeholder.textContent = "?"
                  placeholder.className = "text-gray-400 text-xl"
                  parent.appendChild(placeholder)
                }
              }}
            />
          </div>
        ))}
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="lightbox"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
