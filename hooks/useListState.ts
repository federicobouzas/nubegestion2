'use client'
import { useState, useEffect } from 'react'

interface ListState {
  search: string
  page: number
  pageSize: number
  extras: Record<string, string>
}

const DEFAULT: ListState = { search: '', page: 0, pageSize: 20, extras: {} }

/**
 * Persiste el estado de búsqueda, paginación y filtros extra de un listado en sessionStorage.
 * Al volver al listado (desde un form), el estado se restaura automáticamente.
 *
 * Uso:
 *   const ls = useListState('clientes')
 *   // búsqueda: ls.search, ls.searchInput, ls.setSearchInput, ls.submitSearch
 *   // paginación: ls.page, ls.setPage, ls.pageSize, ls.setPageSize
 *   // filtros extra: ls.extras, ls.setExtra('estado', value)
 */
export function useListState(routeKey: string) {
  const storageKey = `liststate_${routeKey}`

  function readStorage(): ListState {
    if (typeof window === 'undefined') return DEFAULT
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return DEFAULT
      const parsed = JSON.parse(raw)
      return { ...DEFAULT, ...parsed, extras: parsed.extras ?? {} }
    } catch {
      return DEFAULT
    }
  }

  const initial = readStorage()

  const [search, setSearch] = useState(initial.search)
  const [searchInput, setSearchInput] = useState(initial.search)
  const [page, setPage] = useState(initial.page)
  const [pageSize, setPageSize] = useState(initial.pageSize)
  const [extras, setExtras] = useState<Record<string, string>>(initial.extras)

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ search, page, pageSize, extras }))
    } catch {}
  }, [storageKey, search, page, pageSize, extras])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  function handleSetPage(p: number) {
    setPage(p)
  }

  function handleSetPageSize(s: number) {
    setPageSize(s)
    setPage(0)
  }

  function setExtra(key: string, value: string) {
    setExtras(prev => ({ ...prev, [key]: value }))
  }

  return {
    search, setSearch,
    searchInput, setSearchInput,
    page, setPage: handleSetPage,
    pageSize, setPageSize: handleSetPageSize,
    submitSearch,
    extras, setExtra,
  }
}
