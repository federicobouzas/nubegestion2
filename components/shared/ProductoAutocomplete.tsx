'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import type { ItemCatalogo } from '@/types/servicios'

interface Props {
  items: ItemCatalogo[]
  value: string
  label?: string
  error?: string
  onSelect: (item: ItemCatalogo | null) => void
  placeholder?: string
}

const MIN_CHARS = 2

export default function ProductoAutocomplete({ items, value, label, error, onSelect, placeholder = 'Buscar producto o servicio...' }: Props) {
  const [query, setQuery] = useState(label || '')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setQuery(label || '') }, [label])

  const filtered = query.trim().length >= MIN_CHARS
    ? items.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10)
    : []

  const shouldOpen = open && query.trim().length >= MIN_CHARS

  const updatePos = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [])

  useEffect(() => {
    if (shouldOpen) updatePos()
  }, [shouldOpen, updatePos])

  useEffect(() => {
    if (!shouldOpen) return
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [shouldOpen, updatePos])

  function handleSelect(p: ItemCatalogo) {
    setQuery(p.nombre)
    setOpen(false)
    onSelect(p)
  }

  function handleClear() {
    setQuery('')
    setOpen(false)
    onSelect(null)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!shouldOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const borderCls = error
    ? 'border-[#EE3232]'
    : shouldOpen ? 'border-[#F2682E] ring-2 ring-[#F2682E]/10' : 'border-[#E5E4E0] hover:border-[#A8A49D]'

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex items-center bg-white border rounded-[7px] px-2.5 transition-colors ${borderCls}`}>
        <Search size={11} className="text-[#A8A49D] flex-shrink-0 mr-1.5" />
        <input
          ref={inputRef}
          className="flex-1 py-1.5 text-[12.5px] text-[#18181B] bg-transparent outline-none placeholder:text-[#A8A49D]"
          value={query}
          placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {value && (
          <button type="button" onClick={handleClear} className="w-4 h-4 flex items-center justify-center text-[#A8A49D] hover:text-[#EE3232] transition-colors flex-shrink-0">
            <X size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {shouldOpen && dropdownPos && (
        <div
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white border border-[#E5E4E0] rounded-[9px] shadow-xl overflow-hidden"
        >
          {filtered.length > 0 ? filtered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={() => handleSelect(p)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 transition-colors ${i === highlighted ? 'bg-[#FEF0EA]' : 'hover:bg-[#F9F9F8]'}`}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-semibold text-[#18181B] truncate">{p.nombre}</span>
                  {p.tipo === 'servicio' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] flex-shrink-0">SERV</span>
                  )}
                </div>
                {p.codigo && <span className="text-[10px] text-[#A8A49D] font-mono">{p.codigo}</span>}
              </div>
              <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                {p.tipo === 'producto' ? (
                  <span className={`text-[10px] font-mono font-medium ${
                    (p.stock_actual ?? 0) <= 0
                      ? 'text-[#EE3232]'
                      : (p.stock_actual ?? 0) <= (p.stock_minimo ?? 0)
                      ? 'text-[#B45309]'
                      : 'text-[#1A5C38]'
                  }`}>
                    Stock: {p.stock_actual} {p.unidad_medida}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#6B6762]">IVA {p.iva}%</span>
                )}
              </div>
            </button>
          )) : (
            <div className="px-3 py-3 text-[12px] text-[#A8A49D]">
              Sin resultados para "<strong>{query}</strong>"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
