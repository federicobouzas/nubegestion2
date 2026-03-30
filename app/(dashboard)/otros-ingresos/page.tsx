'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import { formatMonto, deleteOtroIngreso, TIPOS_INGRESO } from '@/lib/otros-ingresos'
import { getCuentas } from '@/lib/cuentas'
import { usePaginatedList } from '@/hooks/usePaginatedList'

export default function OtrosIngresosPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCuenta, setFiltroCuenta] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [cuentas, setCuentas] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => { getCuentas({ activo: true }).then(d => setCuentas(d || [])) }, [])

  const filters: Record<string, any> = {}
  if (filtroTipo) filters.tipo = filtroTipo
  if (filtroCuenta) filters.cuenta_id = filtroCuenta

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages, reload } = usePaginatedList({
    table: 'otros_ingresos',
    select: '*, cuentas(nombre)',
    orderBy: 'created_at',
    orderAsc: false,
    search: { column: 'descripcion', value: search },
    filters,
    rangeFilters: [{ column: 'fecha', gte: fechaDesde || undefined, lte: fechaHasta || undefined }],
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este ingreso?')) return
    await deleteOtroIngreso(id)
    reload()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Ingresos' }, { label: 'Otros Ingresos' }]}
        actions={
          <Link href="/otros-ingresos/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Ingreso
          </Link>
        }
      />
      <ListHeader
        title="Otros Ingresos"
        searchPlaceholder="Buscar por descripción..."
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
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-2.5 flex gap-3 items-center flex-shrink-0">
        <select
          value={filtroTipo}
          onChange={e => { setFiltroTipo(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_INGRESO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroCuenta} onChange={e => { setFiltroCuenta(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todas las cuentas</option>
          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#A8A49D]">Fecha</span>
        <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]" />
        <span className="text-[11px] text-[#A8A49D]">—</span>
        <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]" />
        {(filtroTipo || filtroCuenta || fechaDesde || fechaHasta) && (
          <button onClick={() => { setFiltroTipo(''); setFiltroCuenta(''); setFechaDesde(''); setFechaHasta(''); setPage(0) }}
            className="text-[11px] text-[#F2682E] hover:text-[#C94E18] font-medium transition-colors">Limpiar</button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Código', 'Fecha', 'Tipo', 'Descripción', 'Cuenta', 'Importe', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay ingresos.</td></tr>
                ) : data.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{item.codigo}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(item.fecha).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.tipo}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.descripcion || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.cuentas?.nombre || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(item.importe)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/otros-ingresos/${item.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Pencil size={13} strokeWidth={2} /></Link>
                        <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors"><Trash2 size={13} strokeWidth={2} /></button>
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