"use client"

import * as React from "react"
import Image from "next/image"
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
            <Image
              fill
              src={src}
              alt={`media-${i}`}
              className="object-cover"
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
          <Image
            src={lightboxSrc}
            alt="lightbox"
            width={0}
            height={0}
            sizes="90vw"
            className="rounded-lg object-contain"
            style={{ maxHeight: "90vh", maxWidth: "90vw", width: "auto", height: "auto" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
