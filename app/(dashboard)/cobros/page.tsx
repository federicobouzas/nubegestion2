'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import TableSkeleton from '@/components/shared/TableSkeleton'
import ListHeader from '@/components/shared/ListHeader'
import { formatMonto } from '@/lib/cobros'
import { getClientes } from '@/lib/clientes'
import { createClient } from '@/lib/supabase'
import { usePaginatedList } from '@/hooks/usePaginatedList'

export default function CobrosPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [clientes, setClientes] = useState<{ id: string; nombre_razon_social: string }[]>([])

  useEffect(() => { getClientes({ estado: 'activo' }).then(d => setClientes(d || [])) }, [])

  const dbFilters: Record<string, any> = {}
  if (filtroCliente) dbFilters.cliente_id = filtroCliente

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'recibos_cobro',
    select: '*, clientes(nombre_razon_social)',
    orderBy: 'created_at',
    orderAsc: false,
    search: { column: 'codigo', value: search },
    filters: dbFilters,
    rangeFilters: [{ column: 'fecha', gte: fechaDesde || undefined, lte: fechaHasta || undefined }],
    transform: async (rows) => {
      const supabase = createClient()
      return Promise.all(rows.map(async (r: any) => {
        const { data: tot } = await supabase.rpc('get_total_recibo_cobro', { p_recibo_id: r.id })
        return { ...r, total: tot ?? 0 }
      }))
    },
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Ingresos' }, { label: 'Cobros' }]}
        actions={
          <Link href="/cobros/nueva" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Cobro
          </Link>
        }
      />
      <ListHeader
        title="Cobros"
        searchPlaceholder="Buscar por código..."
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
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-2.5 flex gap-3 items-center flex-shrink-0 flex-wrap">
        <select value={filtroCliente} onChange={e => { setFiltroCliente(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los estados</option>
          <option value="cobrado">Cobrado</option>
          <option value="anulado">Anulado</option>
        </select>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#A8A49D]">Fecha</span>
        <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]" />
        <span className="text-[11px] text-[#A8A49D]">—</span>
        <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]" />
        {(filtroCliente || filtroEstado || fechaDesde || fechaHasta) && (
          <button onClick={() => { setFiltroCliente(''); setFiltroEstado(''); setFechaDesde(''); setFechaHasta(''); setPage(0) }}
            className="text-[11px] text-[#F2682E] hover:text-[#C94E18] font-medium transition-colors">Limpiar</button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {['Código','Número','Cliente','Fecha','Total','Estado',''].map((h,i)=><th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody><TableSkeleton cols={['code','short','medium','date','amount','badge','actions']} /></tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Código', 'Número', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayData = filtroEstado
                    ? data.filter((r: any) => filtroEstado === 'anulado' ? r.notas === '[ANULADO]' : r.notas !== '[ANULADO]')
                    : data
                  if (displayData.length === 0) return <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay cobros.</td></tr>
                  return displayData.map((r: any) => {
                  const anulado = r.notas === '[ANULADO]'
                  return (
                    <tr key={r.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{r.codigo}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#18181B]">{r.numero || '—'}</td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{r.clientes?.nombre_razon_social || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(r.total)}</td>
                      <td className="px-4 py-3">
                        {anulado
                          ? <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">Anulado</span>
                          : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />Cobrado</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/cobros/${r.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Eye size={13} strokeWidth={2} /></Link>
                        </div>
                      </td>
                    </tr>
                  )
                  })
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}