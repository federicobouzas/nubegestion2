'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import TableSkeleton from '@/components/shared/TableSkeleton'
import { TIPOS_TICKET, CRITICIDADES, ESTADOS_TICKET } from '@/types/soporte'
import type { TipoTicket, CriticidadTicket, EstadoTicket } from '@/types/soporte'

const estadoVariants: Record<EstadoTicket, string> = {
  abierto: 'bg-[#E8F7EF] text-[#1A5C38]',
  en_progreso: 'bg-[#FEF8E1] text-[#7A5500]',
  resuelto: 'bg-[#E8EEF3] text-[#2B445A]',
  cerrado: 'bg-[#F1F0EE] text-[#6B6762]',
}

const criticidadVariants: Record<CriticidadTicket, string> = {
  baja: 'bg-[#E8EEF3] text-[#2B445A]',
  media: 'bg-[#FEF8E1] text-[#7A5500]',
  alta: 'bg-[#FEF0EA] text-[#C94E18]',
  critica: 'bg-[#FEE8E8] text-[#7F1D1D]',
}

export default function SoportePage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const filters: Record<string, any> = {}
  if (filtroEstado) filters.estado = filtroEstado
  if (filtroTipo) filters.tipo = filtroTipo

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'tickets',
    select: '*',
    orderBy: 'created_at',
    orderAsc: false,
    search: { column: 'titulo', value: search },
    filters,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Sistema' }, { label: 'Soporte' }]}
        actions={
          <Link href="/soporte/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo ticket
          </Link>
        }
      />
      <ListHeader
        title="Tickets de Soporte"
        searchPlaceholder="Buscar por título..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPage={setPage}
        onPageSize={setPageSize}
      />

      {/* Filtros */}
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-2.5 flex gap-3 flex-shrink-0">
        <select
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los estados</option>
          {(Object.entries(ESTADOS_TICKET) as [EstadoTicket, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={e => { setFiltroTipo(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los tipos</option>
          {(Object.entries(TIPOS_TICKET) as [TipoTicket, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F9F9F8] border-b border-[#E5E4E0]">
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Código</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Fecha</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Título</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Tipo</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Criticidad</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={['code', 'date', 'wide', 'medium', 'medium', 'medium', 'actions']} />
              ) : data?.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">Sin tickets registrados.</td></tr>
              ) : data?.map((t: any) => (
                <tr key={t.id} className="group border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{t.codigo}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">
                    {new Date(t.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold text-[#18181B] max-w-xs truncate">{t.titulo}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B6762]">{TIPOS_TICKET[t.tipo as TipoTicket] ?? t.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${criticidadVariants[t.criticidad as CriticidadTicket] ?? ''}`}>
                      {CRITICIDADES[t.criticidad as CriticidadTicket] ?? t.criticidad}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${estadoVariants[t.estado as EstadoTicket] ?? ''}`}>
                      {ESTADOS_TICKET[t.estado as EstadoTicket] ?? t.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/soporte/${t.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                        <Eye size={13} strokeWidth={2} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
