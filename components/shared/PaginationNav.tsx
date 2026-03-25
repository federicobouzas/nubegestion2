'use client'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

export default function PaginationNav({ page, totalPages, onPage }: Props) {
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

  const btn = "h-7 min-w-[28px] px-1.5 rounded-[6px] text-[11.5px] font-semibold flex items-center justify-center transition-colors"
  const active = `${btn} bg-[#F2682E] text-white`
  const inactive = `${btn} border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A]`
  const disabled = `${btn} border border-[#E5E4E0] bg-[#F9F9F8] text-[#C8C4BD] cursor-not-allowed`

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(0)} disabled={page === 0} className={page === 0 ? disabled : inactive}>
        <ChevronsLeft size={12} strokeWidth={2} />
      </button>
      <button onClick={() => onPage(page - 1)} disabled={page === 0} className={page === 0 ? disabled : inactive}>
        <ChevronLeft size={12} strokeWidth={2} />
      </button>
      {getPages().map((p, i) =>
        p === '...'
          ? <span key={`d${i}`} className="px-1 text-[11px] text-[#A8A49D]">…</span>
          : <button key={p} onClick={() => onPage(p as number)} className={p === page ? active : inactive}>{(p as number) + 1}</button>
      )}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} className={page >= totalPages - 1 ? disabled : inactive}>
        <ChevronRight size={12} strokeWidth={2} />
      </button>
      <button onClick={() => onPage(totalPages - 1)} disabled={page >= totalPages - 1} className={page >= totalPages - 1 ? disabled : inactive}>
        <ChevronsRight size={12} strokeWidth={2} />
      </button>
    </div>
  )
}
