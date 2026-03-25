'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import Badge from '@/components/shared/Badge'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { TENANT_ID } from '@/lib/constants'

export default function ProveedoresPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'proveedores',
    select: '*',
    tenant_id: TENANT_ID,
    orderBy: 'nombre_razon_social',
    orderAsc: true,
    search: { column: 'nombre_razon_social', value: search },
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Negocio' }, { label: 'Proveedores' }]}
        actions={
          <Link href="/proveedores/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Proveedor
          </Link>
        }
      />
      <ListHeader
        title="Proveedores"
        searchPlaceholder="Buscar proveedor..."
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
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
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
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay proveedores.</td></tr>
                ) : data.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#18181B]">{p.nombre_razon_social}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{p.cuit || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{p.condicion_iva}</td>
                    <td className="px-4 py-3"><span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] bg-[#DBEAFE] text-[#1E3A8A]">{p.tipo_factura}</span></td>
                    <td className="px-4 py-3"><Badge variant={p.estado === 'activo' ? 'success' : 'default'}>{p.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/proveedores/${p.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Pencil size={13} strokeWidth={2} /></Link>
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