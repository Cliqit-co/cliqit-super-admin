import { nhost } from "./nhost"

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

// Build a best-effort public URL in case SDK helpers change
function buildPublicFileUrl(fileId: string): string {
  const subdomain = (nhost as any)?.config?.subdomain
  const region = (nhost as any)?.config?.region
  if (!subdomain || !region) return ""
  return `https://${subdomain}.storage.${region}.nhost.run/v1/files/${fileId}`
}

export async function getNhostFileUrl(fileIdOrUrl: string | null | undefined): Promise<string | null> {
  if (!fileIdOrUrl) return null
  if (isHttpUrl(fileIdOrUrl)) {
    // Normalize known Nhost storage URL shapes
    try {
      const url = new URL(fileIdOrUrl)
      const host = url.hostname
      const path = url.pathname
      const parts = host.split(".")
      const nhostIndex = parts.lastIndexOf("nhost")
      const isNhost = nhostIndex !== -1 && parts[nhostIndex + 1] === "run"
      if (isNhost) {
        const lastSeg = path.split("/").filter(Boolean).pop() || ""
        // If it's not already using /v1/files and the tail looks like a UUID, rebuild
        if (!/\/v1\/files\//.test(path) && isUuid(lastSeg)) {
          const storageIndex = parts.indexOf("storage")
          // Derive subdomain/region from existing host if possible
          if (storageIndex > 0 && parts[storageIndex + 1]) {
            const subdomain = parts[0]
            const region = parts[storageIndex + 1]
            return `https://${subdomain}.storage.${region}.nhost.run/v1/files/${lastSeg}`
          }
        }
      }
    } catch {
      // fall through
    }
    return fileIdOrUrl
  }

  const fileId = fileIdOrUrl
  if (!isUuid(fileId)) {
    // Unknown format; return as-is and let the browser try
    return fileIdOrUrl
  }

  // Try public URL first
  try {
    const anyStorage = (nhost as any).storage
    if (anyStorage && typeof anyStorage.getPublicUrl === "function") {
      const res = await anyStorage.getPublicUrl({ fileId })
      const url = res?.publicUrl || res?.url
      if (url) return url as string
    }
  } catch (_) {
    // ignore and try fallback
  }

  // Fallback: construct the public path using config
  const constructed = buildPublicFileUrl(fileId)
  if (constructed) return constructed

  // Last resort: presigned URL (for private files)
  try {
    const anyStorage = (nhost as any).storage
    if (anyStorage && typeof anyStorage.getPresignedUrl === "function") {
      const res = await anyStorage.getPresignedUrl({ fileId })
      const url = res?.presignedUrl || res?.url
      if (url) return url as string
    }
  } catch (_) {
    // ignore
  }

  return null
}


