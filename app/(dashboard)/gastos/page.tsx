'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import { formatMonto, getCategoriasGasto } from '@/lib/gastos'
import { createClient } from '@/lib/supabase'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useListState } from '@/hooks/useListState'

export default function GastosPage() {
  const ls = useListState('gastos')
  const [fechaDesde, setFechaDesde] = useState(ls.extras.fechaDesde ?? '')
  const [fechaHasta, setFechaHasta] = useState(ls.extras.fechaHasta ?? '')
  const [filtroTipo, setFiltroTipo] = useState(ls.extras.tipo ?? '')
  const [filtroCategoria, setFiltroCategoria] = useState(ls.extras.categoria ?? '')
  const [categorias, setCategorias] = useState<{ id: string; tipo: string; descripcion: string }[]>([])

  useEffect(() => { getCategoriasGasto().then(d => setCategorias(d || [])) }, [])

  const tiposDisponibles = Array.from(new Set(categorias.map(c => c.tipo)))
  const categoriasFiltradas = filtroTipo ? categorias.filter(c => c.tipo === filtroTipo) : []

  function handleTipo(tipo: string) {
    setFiltroTipo(tipo)
    ls.setExtra('tipo', tipo)
    setFiltroCategoria('')
    ls.setExtra('categoria', '')
    setPage(0)
  }

  const dbFilters: Record<string, any> = {}
  if (filtroCategoria) dbFilters.categoria_id = filtroCategoria

  const { data, total, loading, page, setPage: _setPage, pageSize, setPageSize: _setPageSize, totalPages } = usePaginatedList({
    table: 'gastos',
    select: '*, categorias_gastos(tipo, descripcion)',
    orderBy: 'created_at',
    orderAsc: false,
    search: { column: 'codigo', value: ls.search },
    filters: dbFilters,
    rangeFilters: [{ column: 'fecha_pago', gte: fechaDesde || undefined, lte: fechaHasta || undefined }],
    transform: async (rows) => {
      const supabase = createClient()
      return Promise.all(rows.map(async (g: any) => {
        const { data: tot } = await supabase.rpc('get_total_gasto', { p_gasto_id: g.id })
        return { ...g, total: tot ?? 0 }
      }))
    },
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
        breadcrumb={[{ label: 'Egresos' }, { label: 'Gastos' }]}
        actions={
          <Link href="/gastos/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Gasto
          </Link>
        }
      />
      <ListHeader
        title="Gastos"
        searchPlaceholder="Buscar por código..."
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
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-2.5 flex gap-3 items-center flex-shrink-0 flex-wrap">
        <select value={filtroTipo} onChange={e => handleTipo(e.target.value)}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los tipos</option>
          {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {filtroTipo && (
          <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); ls.setExtra('categoria', e.target.value); setPage(0) }}
            className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
            <option value="">Todas las categorías</option>
            {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
          </select>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#A8A49D]">Fecha</span>
        <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); ls.setExtra('fechaDesde', e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]" />
        <span className="text-[11px] text-[#A8A49D]">—</span>
        <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); ls.setExtra('fechaHasta', e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]" />
        {(filtroTipo || filtroCategoria || fechaDesde || fechaHasta) && (
          <button onClick={() => { setFiltroTipo(''); setFiltroCategoria(''); setFechaDesde(''); setFechaHasta(''); ls.setExtra('tipo', ''); ls.setExtra('categoria', ''); ls.setExtra('fechaDesde', ''); ls.setExtra('fechaHasta', ''); setPage(0) }}
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
                  {['Código', 'Fecha', 'Categoría', 'Descripción', 'Total', 'Estado', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay gastos.</td></tr>
                ) : data.map((g: any) => {
                  const anulado = g.notas === '[ANULADO]'
                  return (
                    <tr key={g.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{g.codigo}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(g.fecha_pago).toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 text-[12px] text-[#6B6762]">{g.categorias_gastos ? `${g.categorias_gastos.tipo} > ${g.categorias_gastos.descripcion}` : '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-[#6B6762]">{g.descripcion || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(g.total)}</td>
                      <td className="px-4 py-3">
                        {anulado
                          ? <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">Anulado</span>
                          : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />Pagado</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/gastos/${g.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Eye size={13} strokeWidth={2} /></Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}