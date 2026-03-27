import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'

export const PAGE_SIZES = [20, 50, 100]

interface Options {
  table: string
  select: string
  orderBy?: string
  orderAsc?: boolean
  filters?: Record<string, any>
  search?: { column: string; value: string }
  transform?: (rows: any[]) => Promise<any[]>
}

export function usePaginatedList(opts: Options) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()  
      const tenantId = await getTenantId()

      let q = supabase
        .from(opts.table)
        .select(opts.select, { count: 'exact' })
        .eq('tenant_id', tenantId)

      if (opts.filters) {
        for (const [key, val] of Object.entries(opts.filters)) {
          if (val !== undefined && val !== null && val !== '') {
            q = q.eq(key, val)
          }
        }
      }

      if (opts.search?.value) {
        q = q.ilike(opts.search.column, `%${opts.search.value}%`)
      }

      q = q
        .order(opts.orderBy || 'created_at', { ascending: opts.orderAsc ?? false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      const { data: rows, count, error } = await q
      if (error) throw error

      const result = opts.transform ? await opts.transform(rows || []) : (rows || [])
      setData(result)
      setTotal(count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, opts.search?.value, JSON.stringify(opts.filters)])

  useEffect(() => { load() }, [load])

  // Al cambiar pageSize o search, volver a página 0
  function handlePageSize(size: number) {
    setPageSize(size)
    setPage(0)
  }

  function handleSearch() {
    setPage(0)
  }

  return {
    data, total, loading,
    page, setPage,
    pageSize, setPageSize: handlePageSize,
    totalPages,
    reload: load,
    handleSearch,
  }
}
