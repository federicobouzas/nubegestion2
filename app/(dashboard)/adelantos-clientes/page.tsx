'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import TableSkeleton from '@/components/shared/TableSkeleton'
import { formatMonto, deleteAdelantoCliente } from '@/lib/adelantos-clientes'
import { getClientes } from '@/lib/clientes'
import { getCuentas } from '@/lib/cuentas'
import { usePaginatedList } from '@/hooks/usePaginatedList'

function estadoBadge(importe: number, importeOriginal: number) {
  if (importe === 0)
    return <span className="text-[10px] font-mono tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-[#F1F0EE] text-[#A8A49D]">Consumido</span>
  if (importe < importeOriginal)
    return <span className="text-[10px] font-mono tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">Parcial</span>
  return <span className="text-[10px] font-mono tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]">Disponible</span>
}

export default function AdelantosClientesPage() {
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroCuenta, setFiltroCuenta]   = useState('')
  const [clientes, setClientes] = useState<{ id: string; nombre_razon_social: string }[]>([])
  const [cuentas, setCuentas]   = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    getClientes({ estado: 'activo' }).then(d => setClientes(d || []))
    getCuentas({ estado: 'activo' }).then(d => setCuentas(d || []))
  }, [])

  const filters: Record<string, any> = {}
  if (filtroCliente) filters.cliente_id = filtroCliente
  if (filtroCuenta)  filters.cuenta_id  = filtroCuenta

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages, reload } = usePaginatedList({
    table: 'adelantos_clientes',
    select: '*, clientes(nombre_razon_social), cuentas(nombre)',
    orderBy: 'fecha',
    orderAsc: false,
    filters,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este adelanto?')) return
    try {
      await deleteAdelantoCliente(id)
      reload()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar.')
    }
  }

  const cols = ['Cliente', 'Fecha', 'Importe Original', 'Saldo Disponible', 'Cuenta', 'Estado', '']

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Ingresos' }, { label: 'Adelantos de Clientes' }]}
        actions={
          <Link href="/adelantos-clientes/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Adelanto
          </Link>
        }
      />
      <ListHeader
        title="Adelantos de Clientes"
        searchPlaceholder="Buscar..."
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
          value={filtroCliente}
          onChange={e => { setFiltroCliente(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los clientes</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>)}
        </select>
        <select
          value={filtroCuenta}
          onChange={e => { setFiltroCuenta(e.target.value); setPage(0) }}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todas las cuentas</option>
          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        {(filtroCliente || filtroCuenta) && (
          <button
            onClick={() => { setFiltroCliente(''); setFiltroCuenta(''); setPage(0) }}
            className="text-[11px] text-[#F2682E] hover:text-[#C94E18] font-medium transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {cols.map((h, i) => <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody><TableSkeleton cols={['wide', 'date', 'amount', 'amount', 'medium', 'medium', 'actions']} /></tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {cols.map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay adelantos.</td></tr>
                ) : data.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.clientes?.nombre_razon_social ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">
                      {new Date(item.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">
                      {formatMonto(Number(item.importe_original))}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">
                      {formatMonto(Number(item.importe))}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.cuentas?.nombre ?? '—'}</td>
                    <td className="px-4 py-3">{estadoBadge(Number(item.importe), Number(item.importe_original))}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/adelantos-clientes/${item.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                          <Eye size={13} strokeWidth={2} />
                        </Link>
                        {Number(item.importe) === Number(item.importe_original) && (
                          <>
                            <Link href={`/adelantos-clientes/${item.id}?editar=1`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                              <Pencil size={13} strokeWidth={2} />
                            </Link>
                            <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors">
                              <Trash2 size={13} strokeWidth={2} />
                            </button>
                          </>
                        )}
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
