export type CsvOptions = {
  fields?: string[]
  headers?: Record<string, string>
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  // If value contains quotes, commas, newlines, wrap in quotes and escape quotes
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function jsonToCsv(rows: Record<string, unknown>[], opts: CsvOptions = {}): string {
  if (!rows || rows.length === 0) return ""
  const fields = opts.fields ?? Object.keys(rows[0])
  const headers = fields.map((f) => opts.headers?.[f] ?? f)

  const lines = [] as string[]
  lines.push(headers.map((h) => escapeCell(h)).join(","))

  for (const r of rows) {
    const cells = fields.map((f) => {
      const v = r[f]
      // stringify arrays and objects
      if (Array.isArray(v)) return escapeCell((v as unknown[]).join("; "))
      if (typeof v === "object" && v !== null) return escapeCell(JSON.stringify(v))
      return escapeCell(v)
    })
    lines.push(cells.join(","))
  }

  return lines.join("\n")
}

export function downloadCsv(content: string, filename = "export.csv") {
  if (!content) return
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
