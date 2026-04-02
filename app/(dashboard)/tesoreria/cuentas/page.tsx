'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import { formatMonto, tipoCuentaLabel } from '@/lib/cuentas'
import { createClient } from '@/lib/supabase'
import { usePaginatedList } from '@/hooks/usePaginatedList'

const tipoBadge = (tipo: string) => {
  const map: Record<string, string> = { efectivo: 'bg-[#E8F7EF] text-[#1A5C38]', banco: 'bg-[#DBEAFE] text-[#1E3A8A]', a_cobrar: 'bg-[#FEF8E1] text-[#7A5500]', a_pagar: 'bg-[#FEE8E8] text-[#7F1D1D]' }
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[tipo] || 'bg-[#F1F0EE] text-[#6B6762]'}`}>{tipoCuentaLabel(tipo)}</span>
}

export default function CuentasPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const dbFilters: Record<string, any> = {}
  if (filtroTipo) dbFilters.tipo = filtroTipo
  if (filtroEstado !== '') dbFilters.estado = filtroEstado === 'activo'

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'cuentas',
    select: '*',
    orderBy: 'nombre',
    orderAsc: true,
    search: { column: 'nombre', value: search },
    filters: dbFilters,
    transform: async (rows) => {
      const supabase = createClient()
      return Promise.all(rows.map(async (c: any) => {
        const { data: saldo } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
        return { ...c, saldo_actual: Number(saldo ?? 0) }
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
        breadcrumb={[{ label: 'Tesorería' }, { label: 'Cuentas' }]}
        actions={
          <Link href="/tesoreria/cuentas/nueva" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nueva Cuenta
          </Link>
        }
      />
      <ListHeader
        title="Cuentas"
        searchPlaceholder="Buscar cuenta..."
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
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los tipos</option>
          <option value="efectivo">Efectivo</option>
          <option value="banco">Banco</option>
          <option value="a_cobrar">A Cobrar</option>
          <option value="a_pagar">A Pagar</option>
        </select>
        <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        {(filtroTipo || filtroEstado) && (
          <button onClick={() => { setFiltroTipo(''); setFiltroEstado(''); setPage(0) }}
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
                  {['Nombre', 'Tipo', 'Saldo actual', 'Estado', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay cuentas.</td></tr>
                ) : data.map((c: any) => (
                  <tr key={c.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#18181B]">{c.nombre}</td>
                    <td className="px-4 py-3">{tipoBadge(c.tipo)}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(c.saldo_actual)}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.estado ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F1F0EE] text-[#6B6762]'}`}>{c.estado ? 'Activo' : 'Inactivo'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/tesoreria/cuentas/${c.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Pencil size={13} strokeWidth={2} /></Link>
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