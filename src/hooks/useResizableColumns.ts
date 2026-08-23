import { useCallback, useEffect, useRef, useState } from 'react'

export interface ColumnWidthDef {
  key: string
  defaultWidth: number
  minWidth: number
}

// Drag-to-resize column widths, persisted per table (by storageKey) so the
// layout a user sets up sticks around between visits.
export function useResizableColumns(storageKey: string, columns: ColumnWidthDef[]) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    let saved: Record<string, number> = {}
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    } catch {
      saved = {}
    }
    const initial: Record<string, number> = {}
    for (const c of columns) {
      initial[c.key] = Math.max(c.minWidth, saved[c.key] ?? c.defaultWidth)
    }
    return initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths))
    } catch {
      // Private browsing / storage full — resizing still works for this session,
      // it just won't be remembered next visit.
    }
  }, [storageKey, widths])

  const widthsRef = useRef(widths)
  useEffect(() => {
    widthsRef.current = widths
  }, [widths])

  const [resizingKey, setResizingKey] = useState<string | null>(null)

  const startResize = useCallback(
    (key: string) => (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = widthsRef.current[key]
      const minWidth = columns.find((c) => c.key === key)?.minWidth ?? 60

      setResizingKey(key)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      function onMove(ev: MouseEvent) {
        const next = Math.max(minWidth, startWidth + (ev.clientX - startX))
        setWidths((prev) => ({ ...prev, [key]: next }))
      }
      function onUp() {
        setResizingKey(null)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [columns]
  )

  return { widths, resizingKey, startResize }
}
