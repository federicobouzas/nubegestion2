'use client'
import { Search } from 'lucide-react'
import PaginationNav from './PaginationNav'

interface Props {
  title: string
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (v: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  total: number
  page: number
  pageSize: number
  totalPages: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}

const PAGE_SIZES = [20, 50, 100]

export default function ListHeader({
  title, searchPlaceholder = 'Buscar...',
  searchValue, onSearchChange, onSearchSubmit,
  total, page, pageSize, totalPages, onPage, onPageSize
}: Props) {
  return (
    <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-4">
        {/* Izquierda: título + buscador */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B] flex-shrink-0">{title}</h1>
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2 bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-1.5">
            <Search size={13} className="text-[#A8A49D] flex-shrink-0" />
            <input
              className="bg-transparent text-[12.5px] placeholder:text-[#A8A49D] outline-none w-[180px]"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
            />
          </form>
        </div>

        {/* Derecha: total + selector + nav */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[11px] text-[#A8A49D]">
            Total: <strong className="text-[#18181B]">{total.toLocaleString('es-AR')}</strong>
          </span>
          <select
            value={pageSize}
            onChange={e => onPageSize(Number(e.target.value))}
            className="h-7 text-[11px] font-semibold border border-[#E5E4E0] rounded-[6px] px-2 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <PaginationNav page={page} totalPages={totalPages} onPage={onPage} />
        </div>
      </div>
    </div>
  )
}
