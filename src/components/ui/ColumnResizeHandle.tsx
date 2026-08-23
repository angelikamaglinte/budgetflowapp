import { cn } from '@/lib/utils'

interface ColumnResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  active: boolean
}

// A thin drag strip on a <th>'s right edge. The parent <th> must be
// `relative` for this to anchor correctly.
export function ColumnResizeHandle({ onMouseDown, active }: ColumnResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="group absolute top-0 right-0 -mr-1.5 h-full w-3 cursor-col-resize select-none z-10"
    >
      <span
        className={cn(
          'mx-auto block h-full w-px transition-colors',
          active ? 'bg-primary-500' : 'bg-transparent group-hover:bg-primary-300'
        )}
      />
    </div>
  )
}
