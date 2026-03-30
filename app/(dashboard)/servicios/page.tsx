'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import Badge from '@/components/shared/Badge'

export default function ServiciosPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filters: Record<string, any> = {}
  if (filtroEstado) filters.estado = filtroEstado

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'servicios',
    select: '*',
    orderBy: 'nombre',
    orderAsc: true,
    search: { column: 'nombre', value: search },
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
        breadcrumb={[{ label: 'Negocio' }, { label: 'Servicios' }]}
        actions={
          <Link href="/servicios/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo servicio
          </Link>
        }
      />
      <ListHeader
        title="Servicios"
        searchPlaceholder="Buscar servicio..."
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
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-2.5 flex gap-3 flex-shrink-0">
        <select
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F9F9F8] border-b border-[#E5E4E0]">
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Nombre</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Descripción</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">IVA</th>
                <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">Cargando...</td></tr>
              ) : data?.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">Sin servicios registrados.</td></tr>
              ) : data?.map((s: any) => (
                <tr key={s.id} className="group border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors">
                  <td className="px-4 py-3 text-[12px] font-semibold text-[#18181B]">{s.nombre}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B6762] max-w-xs truncate">{s.descripcion || <span className="text-[#A8A49D]">—</span>}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{s.iva}%</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.estado === 'activo' ? 'success' : 'danger'}>{s.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/servicios/${s.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                        <Pencil size={13} strokeWidth={2} />
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
