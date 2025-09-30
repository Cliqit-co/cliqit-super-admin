import Image from "next/image"
import { User } from "lucide-react"
import { getNhostFileUrl } from "@/lib/nhost-storage"
import { useEffect, useState } from "react"

interface RemoteAvatarProps {
  src?: string | null
  alt?: string
  size?: number
  className?: string
}

export function RemoteAvatar({ src, alt = "Avatar", size = 48, className }: RemoteAvatarProps) {
  const [resolved, setResolved] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getNhostFileUrl(src || undefined)
      .then((u) => {
        if (mounted) setResolved(u)
      })
      .catch(() => {
        if (mounted) setResolved(null)
      })
    return () => {
      mounted = false
    }
  }, [src])

  const isNhostUrl = (url: string) => /\.nhost\.run\//.test(url)

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
          unoptimized={isNhostUrl(resolved)}
        />
      ) : (
        <User className="h-1/2 w-1/2 text-primary" />
      )}
    </div>
  )
}
