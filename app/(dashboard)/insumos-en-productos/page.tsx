'use client'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import TableSkeleton from '@/components/shared/TableSkeleton'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useListState } from '@/hooks/useListState'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'

async function enrichWithReceta(rows: any[]) {
  if (!rows.length) return rows
  const supabase = createClient()
  const tenantId = await getTenantId()
  const ids = rows.map((r: any) => r.id)
  const { data } = await supabase
    .from('insumos_productos')
    .select('producto_id')
    .eq('tenant_id', tenantId)
    .in('producto_id', ids)
  const conInsumos = new Set((data || []).map((r: any) => r.producto_id))
  return rows.map((r: any) => ({ ...r, tiene_insumos: conInsumos.has(r.id) }))
}

export default function InsumosEnProductosPage() {
  const ls = useListState('insumos-en-productos')

  const { data, total, loading, page, setPage: _setPage, pageSize, setPageSize: _setPageSize, totalPages } =
    usePaginatedList({
      table: 'productos',
      select: 'id, nombre, stock_actual, estado',
      orderBy: 'nombre',
      orderAsc: true,
      search: { column: 'nombre', value: ls.search },
      transform: enrichWithReceta,
      initialPage: ls.page,
      initialPageSize: ls.pageSize,
    })

  function setPage(p: number) { _setPage(p); ls.setPage(p) }
  function setPageSize(s: number) { _setPageSize(s); ls.setPageSize(s) }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    ls.setSearch(ls.searchInput)
    ls.setPage(0)
    _setPage(0)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Insumos en Productos' }]} />
      <ListHeader
        title="Insumos en Productos"
        searchPlaceholder="Buscar producto..."
        searchValue={ls.searchInput}
        onSearchChange={ls.setSearchInput}
        onSearchSubmit={submitSearch}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPage={setPage}
        onPageSize={setPageSize}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {['Producto', 'Stock', 'Estado Producto', 'Receta', ''].map((h, i) => (
                  <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={['wide', 'amount', 'medium', 'medium', 'actions']} />
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">No hay productos.</td></tr>
              ) : data.map((p: any) => (
                <tr key={p.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] group transition-colors">
                  <td className="px-4 py-3 text-[12px] text-[#18181B] font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">
                    {Number(p.stock_actual ?? 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${p.estado === 'activo' ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#FEE8E8] text-[#7F1D1D]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.estado === 'activo' ? 'bg-[#4EBB7F]' : 'bg-[#EE3232]'}`} />
                      {p.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${p.tiene_insumos ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#FEF0EA] text-[#C94E18]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.tiene_insumos ? 'bg-[#4EBB7F]' : 'bg-[#F2682E]'}`} />
                      {p.tiene_insumos ? 'Con insumos' : 'Sin insumos'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link
                        href={`/insumos-en-productos/${p.id}`}
                        className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
                      >
                        <Settings2 size={13} strokeWidth={2} />
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
