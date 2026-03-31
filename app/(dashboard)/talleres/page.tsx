'use client'
import Link from 'next/link'
import { Plus, Eye, Pencil } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useListState } from '@/hooks/useListState'

export default function TalleresPage() {
  const ls = useListState('talleres')

  const { data, total, loading, page, setPage: _setPage, pageSize, setPageSize: _setPageSize, totalPages } =
    usePaginatedList({
      table: 'talleres',
      select: '*',
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
        breadcrumb={[{ label: 'Producción' }, { label: 'Talleres' }]}
        actions={
          <Link
            href="/talleres/nuevo"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            <Plus size={13} strokeWidth={2.2} /> Nuevo Taller
          </Link>
        }
      />
      <ListHeader
        title="Talleres"
        searchPlaceholder="Buscar taller..."
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
                {['Nombre', 'Fecha de Alta', ''].map((h, i) => (
                  <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">No hay talleres.</td></tr>
              ) : data.map((t: any) => (
                <tr key={t.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] group transition-colors">
                  <td className="px-4 py-3 text-[12px] text-[#18181B] font-medium">{t.nombre}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">
                    {new Date(t.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link href={`/talleres/${t.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                        <Eye size={13} strokeWidth={2} />
                      </Link>
                      <Link href={`/talleres/${t.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
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
