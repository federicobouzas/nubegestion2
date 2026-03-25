'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import Pagination from '@/components/shared/Pagination'
import { getRecibosPago, formatMonto } from '@/lib/pagos'
import type { ReciboPago } from '@/types/pagos'

export default function PagosPage() {
  const [recibos, setRecibos] = useState<ReciboPago[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setRecibos((await getRecibosPago(search || undefined)) || []) } finally { setLoading(false) }
  }, [search])
  useEffect(() => { load() }, [load])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Egresos' }, { label: 'Pagos' }]}
        actions={
          <Link href="/pagos/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nuevo Pago
          </Link>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <div className="mb-3">
          <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Pagos</h1>
          <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{recibos.length} recibos</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-1.5 max-w-[300px]">
          <Search size={13} className="text-[#A8A49D]" />
          <input className="bg-transparent text-[12.5px] text-[#18181B] placeholder:text-[#A8A49D] outline-none flex-1" placeholder="Buscar por código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div> : (
          recibos.length === 0 ? (
            <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
              No hay pagos todavía. <Link href="/pagos/nuevo" className="text-[#F2682E] font-semibold hover:underline">Crear el primero</Link>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                    {['Código','Número','Proveedor','Fecha','Total','Estado',''].map((h,i) => (
                      <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recibos.map(r => {
                    const anulado = r.notas === '[ANULADO]'
                    return (
                      <tr key={r.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                        <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{r.codigo}</td>
                        <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#18181B]">{r.numero || '—'}</td>
                        <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{r.proveedores?.nombre_razon_social || '—'}</td>
                        <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                        <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(r.total)}</td>
                        <td className="px-4 py-3">
                          {anulado
                            ? <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">Anulado</span>
                            : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />Pagado</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/pagos/${r.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Eye size={13} strokeWidth={2} /></Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
