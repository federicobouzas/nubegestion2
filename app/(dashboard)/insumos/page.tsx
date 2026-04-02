'use client'
import Link from 'next/link'
import { Plus, Eye, Pencil } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import TableSkeleton from '@/components/shared/TableSkeleton'
import ListHeader from '@/components/shared/ListHeader'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useListState } from '@/hooks/useListState'
import { formatMonto } from '@/lib/gastos'

function EstadoBadge({ estado }: { estado: string }) {
  const activo = estado === 'activo'
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${activo ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#FEE8E8] text-[#7F1D1D]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-[#4EBB7F]' : 'bg-[#EE3232]'}`} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export default function InsumosPage() {
  const ls = useListState('insumos')

  const { data, total, loading, page, setPage: _setPage, pageSize, setPageSize: _setPageSize, totalPages } =
    usePaginatedList({
      table: 'insumos_produccion',
      select: '*, proveedores(nombre_razon_social)',
      orderBy: 'nombre',
      orderAsc: true,
      search: { column: 'nombre', value: ls.search },
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
      <Topbar
        breadcrumb={[{ label: 'Producción' }, { label: 'Insumos' }]}
        actions={
          <Link
            href="/insumos/nuevo"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            <Plus size={13} strokeWidth={2.2} /> Nuevo Insumo
          </Link>
        }
      />
      <ListHeader
        title="Insumos"
        searchPlaceholder="Buscar insumo..."
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
                {['Nombre', 'Proveedor', 'Unidad', 'Precio Compra', 'IVA', 'Stock', 'Estado', ''].map((h, i) => (
                  <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={['medium','medium','short','amount','short','short','badge','actions']} />
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">No hay insumos.</td></tr>
              ) : data.map((ins: any) => (
                <tr key={ins.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] group transition-colors">
                  <td className="px-4 py-3 text-[12px] text-[#18181B] font-medium">{ins.nombre}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B6762]">{ins.proveedores?.nombre_razon_social || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{ins.unidad_medida}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(Number(ins.precio_compra))}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{ins.iva}%</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{Number(ins.stock).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3"><EstadoBadge estado={ins.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link href={`/insumos/${ins.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                        <Eye size={13} strokeWidth={2} />
                      </Link>
                      <Link href={`/insumos/${ins.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
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
