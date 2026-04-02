'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import TableSkeleton from '@/components/shared/TableSkeleton'
import ListHeader from '@/components/shared/ListHeader'
import Badge from '@/components/shared/Badge'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useListState } from '@/hooks/useListState'

export default function ClientesPage() {
  const ls = useListState('clientes')
  const [filtroEstado, setFiltroEstado] = useState(ls.extras.estado ?? '')

  const filters: Record<string, any> = {}
  if (filtroEstado) filters.estado = filtroEstado

  const { data, total, loading, page, setPage: _setPage, pageSize, setPageSize: _setPageSize, totalPages } = usePaginatedList({
    table: 'clientes',
    select: '*',
    orderBy: 'nombre_razon_social',
    orderAsc: true,
    search: { column: 'nombre_razon_social', value: ls.search },
    filters,
    initialPage: ls.page,
    initialPageSize: ls.pageSize,
  })

  function setPage(p: number) { _setPage(p); ls.setPage(p) }
  function setPageSize(s: number) { _setPageSize(s); ls.setPageSize(s) }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    ls.setSearch(ls.searchInput)
    ls.setPage(0)
    _setPage(0)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Negocio' }, { label: 'Clientes' }]}
        actions={
          <Link href="/clientes/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Cliente
          </Link>
        }
      />
      <ListHeader
        title="Clientes"
        searchPlaceholder="Buscar cliente..."
        searchValue={ls.searchInput}
        onSearchChange={ls.setSearchInput}
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
          onChange={e => { setFiltroEstado(e.target.value); ls.setExtra('estado', e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {['Nombre / Razón Social','CUIT','Condición IVA','Tipo Factura','Estado',''].map((h,i)=><th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody><TableSkeleton cols={['medium','short','medium','badge','badge','actions']} /></tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Nombre / Razón Social','CUIT','Condición IVA','Tipo Factura','Estado',''].map((h,i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay clientes.</td></tr>
                ) : data.map((c: any) => (
                  <tr key={c.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#18181B]">{c.nombre_razon_social}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{c.cuit || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{c.condicion_iva}</td>
                    <td className="px-4 py-3"><span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-[#E8F7EF] text-[#1A5C38]">{c.tipo_factura}</span></td>
                    <td className="px-4 py-3"><Badge variant={c.estado === 'activo' ? 'success' : 'danger'}>{c.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/clientes/${c.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Pencil size={13} strokeWidth={2} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}