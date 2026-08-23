import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useResizableColumns } from './useResizableColumns'
import type { ColumnWidthDef } from './useResizableColumns'

const COLUMNS: ColumnWidthDef[] = [
  { key: 'name', defaultWidth: 200, minWidth: 120 },
  { key: 'amount', defaultWidth: 100, minWidth: 80 },
]

function TestTable({ storageKey = 'test:columns' }: { storageKey?: string }) {
  const { widths, resizingKey, startResize } = useResizableColumns(storageKey, COLUMNS)
  return (
    <table>
      <thead>
        <tr>
          <th data-testid="th-name" style={{ width: widths.name }}>
            Name
            <div data-testid="handle-name" onMouseDown={startResize('name')} />
          </th>
          <th data-testid="th-amount" style={{ width: widths.amount }}>
            Amount
            <div data-testid="handle-amount" onMouseDown={startResize('amount')} />
          </th>
        </tr>
      </thead>
      <tbody />
      <tfoot>
        <tr>
          <td data-testid="resizing-key">{resizingKey ?? 'none'}</td>
        </tr>
      </tfoot>
    </table>
  )
}

function drag(handle: HTMLElement, fromX: number, toX: number) {
  fireEvent.mouseDown(handle, { clientX: fromX })
  fireEvent.mouseMove(window, { clientX: toX })
  fireEvent.mouseUp(window)
}

beforeEach(() => {
  localStorage.clear()
})

describe('useResizableColumns', () => {
  it('starts each column at its default width', () => {
    render(<TestTable />)
    expect(screen.getByTestId('th-name')).toHaveStyle({ width: '200px' })
    expect(screen.getByTestId('th-amount')).toHaveStyle({ width: '100px' })
  })

  it('grows a column by the drag distance', () => {
    render(<TestTable />)
    drag(screen.getByTestId('handle-name'), 100, 180)
    expect(screen.getByTestId('th-name')).toHaveStyle({ width: '280px' })
  })

  it('shrinks a column by the drag distance', () => {
    render(<TestTable />)
    drag(screen.getByTestId('handle-name'), 100, 60)
    expect(screen.getByTestId('th-name')).toHaveStyle({ width: '160px' })
  })

  it('never shrinks a column below its configured minWidth', () => {
    render(<TestTable />)
    // Dragging the "name" column (default 200, min 120) far past its floor.
    drag(screen.getByTestId('handle-name'), 100, -500)
    expect(screen.getByTestId('th-name')).toHaveStyle({ width: '120px' })
  })

  it('only reports the column actively being dragged as resizing', () => {
    render(<TestTable />)
    const handle = screen.getByTestId('handle-name')
    fireEvent.mouseDown(handle, { clientX: 100 })
    expect(screen.getByTestId('resizing-key')).toHaveTextContent('name')
    fireEvent.mouseUp(window)
    expect(screen.getByTestId('resizing-key')).toHaveTextContent('none')
  })

  it('does not let dragging one column affect another', () => {
    render(<TestTable />)
    drag(screen.getByTestId('handle-name'), 100, 200)
    expect(screen.getByTestId('th-amount')).toHaveStyle({ width: '100px' })
  })

  it('persists widths to localStorage under the given key', () => {
    render(<TestTable storageKey="test:persist" />)
    drag(screen.getByTestId('handle-amount'), 100, 140)
    const saved = JSON.parse(localStorage.getItem('test:persist') ?? '{}')
    expect(saved.amount).toBe(140)
  })

  it('restores widths from localStorage on next mount', () => {
    localStorage.setItem('test:reload', JSON.stringify({ name: 260, amount: 90 }))
    render(<TestTable storageKey="test:reload" />)
    expect(screen.getByTestId('th-name')).toHaveStyle({ width: '260px' })
    expect(screen.getByTestId('th-amount')).toHaveStyle({ width: '90px' })
  })

  it('clamps a saved width below minWidth back up on restore', () => {
    localStorage.setItem('test:reload-clamped', JSON.stringify({ name: 10 }))
    render(<TestTable storageKey="test:reload-clamped" />)
    expect(screen.getByTestId('th-name')).toHaveStyle({ width: '120px' })
  })
})
