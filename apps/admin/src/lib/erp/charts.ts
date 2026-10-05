// Arithmetic behind the hand-drawn charts. Pure and free of app imports, so it is unit-testable in plain Node.

export type BreakdownItem = { label: string; value: number }

// A ranked entry; the synthetic "Other" entry keeps what it swallowed so the names can still be shown.
export type FoldedItem = BreakdownItem & { otherItems?: BreakdownItem[] }

// Largest first, keeping the top `limit` and collapsing the rest into one "Other (N)" entry; empty and negative values are dropped.
export function rankAndFold(items: readonly BreakdownItem[], limit = 6): FoldedItem[] {
  const sorted = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
  if (sorted.length <= limit) return sorted

  const rest = sorted.slice(limit)
  return [
    ...sorted.slice(0, limit),
    { label: `Other (${rest.length})`, value: rest.reduce((sum, item) => sum + item.value, 0), otherItems: rest },
  ]
}

// The donut is drawn on a circle of this radius because its circumference is 100, so dash lengths are plain percentages.
export const DONUT_RADIUS = 15.915

// Each slice as a percentage of the whole plus the dash offset that starts it where the previous slice ended, from 12 o'clock.
export function donutSegments(values: readonly number[]): { percent: number; offset: number }[] {
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return values.map(() => ({ percent: 0, offset: 25 }))

  let before = 0
  return values.map((value) => {
    const percent = (value / total) * 100
    const segment = { percent, offset: 25 - before }
    before += percent
    return segment
  })
}

// Where point `index` of `count` sits across a 0–100 plot: the centre of its equal-width slot.
export function xAt(index: number, count: number): number {
  return ((index + 0.5) / count) * 100
}

// An SVG path through the values on a 100 × 100 plot, with zero at the bottom and `max` at the top.
export function linePath(values: readonly number[], max: number): string {
  const top = Math.max(1, max)
  return values
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index, values.length).toFixed(2)} ${((1 - value / top) * 100).toFixed(2)}`)
    .join(' ')
}
