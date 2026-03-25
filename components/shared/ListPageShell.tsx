'use client'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import Topbar from './Topbar'

interface Props {
  breadcrumb: { label: string; href?: string }[]
  title: string
  count: number
  newHref: string
  newLabel: string
  search: string
  onSearch: (v: string) => void
  loading: boolean
  children: React.ReactNode
}

export default function ListPageShell({ breadcrumb, title, count, newHref, newLabel, search, onSearch, loading, children }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={breadcrumb} actions={
        <Link href={newHref} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
          <Plus size={13} strokeWidth={2.2} /> {newLabel}
        </Link>
      } />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">{title}</h1>
            <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{count} registros</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-1.5 max-w-[300px]">
          <Search size={13} className="text-[#A8A49D]" />
          <input className="bg-transparent text-[12.5px] text-[#18181B] placeholder:text-[#A8A49D] outline-none flex-1" placeholder={`Buscar...`} value={search} onChange={e => onSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div> : children}
      </div>
    </div>
  )
}
