'use client'
import { PAGE_SIZES } from '@/hooks/usePaginatedList'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Props {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}

export default function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }: Props) {
  // Generar páginas visibles
  function getPages() {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
    } else {
      pages.push(0)
      if (page > 3) pages.push('...')
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i)
      if (page < totalPages - 4) pages.push('...')
      pages.push(totalPages - 1)
    }
    return pages
  }

  const btnBase = "h-7 min-w-[28px] px-1.5 rounded-[6px] text-[11.5px] font-semibold flex items-center justify-center transition-colors"
  const btnActive = `${btnBase} bg-[#F2682E] text-white`
  const btnInactive = `${btnBase} border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A]`
  const btnDisabled = `${btnBase} border border-[#E5E4E0] bg-[#F9F9F8] text-[#C8C4BD] cursor-not-allowed`

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E4E0] bg-[#F9F9F8]">
      {/* Total + selector */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-[#A8A49D]">
          Total: <strong className="text-[#18181B]">{total.toLocaleString('es-AR')}</strong> registros
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-[#A8A49D] uppercase tracking-wide">Mostrar</span>
          <select
            value={pageSize}
            onChange={e => onPageSize(Number(e.target.value))}
            className="h-6 text-[11px] font-semibold border border-[#E5E4E0] rounded-[5px] px-1.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(0)} disabled={page === 0} className={page === 0 ? btnDisabled : btnInactive}>
          <ChevronsLeft size={12} strokeWidth={2} />
        </button>
        <button onClick={() => onPage(page - 1)} disabled={page === 0} className={page === 0 ? btnDisabled : btnInactive}>
          <ChevronLeft size={12} strokeWidth={2} />
        </button>
        {getPages().map((p, i) =>
          p === '...'
            ? <span key={`dots-${i}`} className="px-1 text-[11px] text-[#A8A49D]">…</span>
            : <button key={p} onClick={() => onPage(p as number)} className={p === page ? btnActive : btnInactive}>{(p as number) + 1}</button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} className={page >= totalPages - 1 ? btnDisabled : btnInactive}>
          <ChevronRight size={12} strokeWidth={2} />
        </button>
        <button onClick={() => onPage(totalPages - 1)} disabled={page >= totalPages - 1} className={page >= totalPages - 1 ? btnDisabled : btnInactive}>
          <ChevronsRight size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
