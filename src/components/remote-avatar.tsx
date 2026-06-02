"use client"

import Image from "next/image"
import { User } from "lucide-react"
import { resolveStorageUrl } from "@/lib/storage"
import { useMemo } from "react"

interface RemoteAvatarProps {
  src?: string | null
  alt?: string
  size?: number
  className?: string
}

export function RemoteAvatar({ src, alt = "Avatar", size = 48, className }: RemoteAvatarProps) {
  const resolved = useMemo(() => resolveStorageUrl(src || undefined), [src])

  return (
    <div
      className={`rounded-full overflow-hidden bg-primary/10 flex items-center justify-center` + (className ? ` ${className}` : "")}
      style={{ width: size, height: size }}
    >
      {resolved ? (
        <Image
          src={resolved}
          alt={alt}
          width={size}
          height={size}
          unoptimized
        />
      ) : (
        <User className="h-1/2 w-1/2 text-primary" />
      )}
    </div>
  )
}
