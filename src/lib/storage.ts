// Resolves a stored value to a fetchable URL.
// Accepts:
//   - full http(s) URL (passes through, including legacy nhost.run URLs)
//   - "bucket/path/to/file" form → resolves via Supabase Storage public URL
//   - bare path (no slash) → assumed in the "avatars" bucket

import { supabase } from "./supabase"

function isHttpUrl(v: string): boolean {
  return /^https?:\/\//i.test(v)
}

export function resolveStorageUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (isHttpUrl(value)) return value

  // Convention: "<bucket>/<object-path>"
  let bucket = "avatars"
  let path = value
  const firstSlash = value.indexOf("/")
  if (firstSlash > 0) {
    bucket = value.slice(0, firstSlash)
    path = value.slice(firstSlash + 1)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl ?? null
}
