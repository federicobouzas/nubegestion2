'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import { calcularEstadoCompra, formatMonto } from '@/lib/compras'
import { createClient } from '@/lib/supabase'
import { usePaginatedList } from '@/hooks/usePaginatedList'

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = { pagada: 'bg-[#E8F7EF] text-[#1A5C38]', pendiente: 'bg-[#FEF8E1] text-[#7A5500]', vencida: 'bg-[#FEE8E8] text-[#7F1D1D]' }
  const dot: Record<string, string> = { pagada: 'bg-[#4EBB7F]', pendiente: 'bg-[#FDBC16]', vencida: 'bg-[#EE3232]' }
  const label: Record<string, string> = { pagada: 'Pagada', pendiente: 'Pendiente', vencida: 'Vencida' }
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[estado]}`}><span className={`w-1.5 h-1.5 rounded-full ${dot[estado]}`} />{label[estado]}</span>
}

export default function ComprasPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'facturas_compra',
    select: '*, proveedores(nombre_razon_social, cuit, condicion_iva)',
    orderBy: 'created_at',
    orderAsc: false,
    search: { column: 'codigo', value: search },
    transform: async (rows) => {
      const supabase = createClient()
      return Promise.all(rows.map(async (fc: any) => {
        const { data: saldo } = await supabase.rpc('get_saldo_factura_compra', { p_factura_id: fc.id })
        const { data: tot } = await supabase.rpc('get_total_factura_compra_con_percepciones', { p_factura_id: fc.id })
        return { ...fc, saldo_pendiente: saldo ?? 0, total: tot ?? 0 }
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
        breadcrumb={[{ label: 'Egresos' }, { label: 'Compras' }]}
        actions={
          <Link href="/compras/nueva" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nueva Compra
          </Link>
        }
      />
      <ListHeader
        title="Compras"
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
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Código', 'Número', 'Tipo', 'Proveedor', 'Fecha', 'Total', 'Saldo', 'Estado', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay facturas de compra.</td></tr>
                ) : data.map((f: any) => {
                  const estado = calcularEstadoCompra(f.saldo_pendiente, f.fecha_vencimiento)
                  const anulada = f.notas === '[ANULADA]'
                  return (
                    <tr key={f.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{f.codigo}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#18181B]">{f.numero || '—'}</td>
                      <td className="px-4 py-3"><span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] ${f.tipo === 'A' ? 'bg-[#DBEAFE] text-[#1E3A8A]' : f.tipo === 'B' ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F0EBFB] text-[#3D1F8A]'}`}>{f.tipo}</span></td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{f.proveedores?.nombre_razon_social || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(f.fecha_emision).toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(f.total)}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{formatMonto(f.saldo_pendiente)}</td>
                      <td className="px-4 py-3">{anulada ? <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">Anulada</span> : estadoBadge(estado)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/compras/${f.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Eye size={13} strokeWidth={2} /></Link>
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