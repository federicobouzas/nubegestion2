export function applyFilters(q: any, filters: Record<string, any>) {
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue
    q = q.eq(key, value)
  }
  return q
}