// Indian financial year runs 1 April to 31 March, so January to March belongs to the year that started the previous April.
// Kept free of app imports so it is unit-testable without Next.js path alias resolution.

export function financialYearOf(date: Date): string {
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 3 ? year : year - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}
