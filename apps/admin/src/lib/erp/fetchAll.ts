// Reads every row of a query, however many there are. Pure and free of app imports, so it is unit-testable in plain Node.
// Supabase returns at most 1,000 rows per request and drops the rest without an error, which would quietly corrupt any total built from them.

type PageResult<T> = { data: T[] | null; error: { message: string } | null }

export const FETCH_PAGE_SIZE = 1000

// `page` must build the query afresh each call and end in .range(from, to), with an order that never ties, so chunks neither overlap nor skip.
// Returns { data } so it drops in where a single query's result was destructured.
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = FETCH_PAGE_SIZE
): Promise<{ data: T[] }> {
  const rows: T[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1)
    // Failing loudly beats showing totals worked out from part of the data.
    if (error) throw new Error('Could not load the full list: ' + error.message)

    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) return { data: rows }
  }
}
