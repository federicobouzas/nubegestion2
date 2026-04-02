'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import TableSkeleton from '@/components/shared/TableSkeleton'
import ListHeader from '@/components/shared/ListHeader'
import { getCuentas } from '@/lib/cuentas'
import { deleteMovimiento, formatMonto } from '@/lib/movimientos'
import { usePaginatedList } from '@/hooks/usePaginatedList'

export default function MovimientosPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [cuentas, setCuentas] = useState<any[]>([])

  // Filtros
  const [cuentaFilter, setCuentaFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages, reload } = usePaginatedList({
    table: 'movimientos_cuentas',
    select: '*, cuentas_origen:cuenta_origen_id(nombre), cuentas_destino:cuenta_destino_id(nombre)',
    orderBy: 'fecha',
    orderAsc: false,
    filters: {
      ...(cuentaFilter ? { cuenta_origen_id: cuentaFilter } : {}),
    },
    search: { column: 'observacion', value: search },
  })

  // Filtro de fecha client-side (usePaginatedList no soporta gte/lte nativamente)
  const filteredData = data.filter((m: any) => {
    if (fechaDesde && m.fecha < fechaDesde) return false
    if (fechaHasta && m.fecha > fechaHasta) return false
    return true
  })

  useEffect(() => {
    getCuentas({ activo: true }).then(d => setCuentas(d || []))
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return
    await deleteMovimiento(id)
    reload()
  }

  function clearFilters() {
    setCuentaFilter('')
    setFechaDesde('')
    setFechaHasta('')
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  const hasFilters = cuentaFilter || fechaDesde || fechaHasta

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Tesorería' }, { label: 'Movimientos' }]}
        actions={
          <Link href="/tesoreria/movimientos/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Movimiento
          </Link>
        }
      />
      <ListHeader
        title="Movimientos entre Cuentas"
        searchPlaceholder="Buscar por observación..."
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
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <span className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Filtros</span>
        <select
          value={cuentaFilter}
          onChange={e => { setCuentaFilter(e.target.value); setPage(0) }}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todas las cuentas</option>
          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
          placeholder="Desde"
        />
        <span className="text-[11px] text-[#A8A49D]">a</span>
        <input
          type="date"
          value={fechaHasta}
          onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
          placeholder="Hasta"
        />
        {hasFilters && (
          <button onClick={clearFilters} className="text-[11px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {['Fecha','Cuenta Origen','Cuenta Destino','Monto','Observación',''].map((h,i)=><th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody><TableSkeleton cols={['date','medium','medium','amount','wide','actions']} /></tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Fecha', 'Cuenta Origen', 'Cuenta Destino', 'Monto', 'Observación', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay movimientos.</td></tr>
                ) : filteredData.map((m: any) => (
                  <tr key={m.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{m.cuentas_origen?.nombre || '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{m.cuentas_destino?.nombre || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(m.monto)}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762] max-w-[250px] truncate">{m.observacion || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/tesoreria/movimientos/${m.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                          <Eye size={13} strokeWidth={2} />
                        </Link>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
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
