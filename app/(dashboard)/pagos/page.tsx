'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'
import { formatMonto } from '@/lib/pagos'
import { createClient } from '@/lib/supabase'
import { TENANT_ID } from '@/lib/constants'

const PAGE_SIZE_DEFAULT = 20

export default function PagosPage() {
  const [recibos, setRecibos] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('recibos_pago')
      .select('*, proveedores(nombre_razon_social)', { count: 'exact' })
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (search) q = q.ilike('codigo', `%${search}%`)
    const { data, count } = await q
    const result = await Promise.all((data || []).map(async (r: any) => {
      const { data: tot } = await supabase.rpc('get_total_recibo_pago', { p_recibo_id: r.id })
      return { ...r, total: tot ?? 0 }
    }))
    setRecibos(result)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, pageSize, search])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(0) }
  function handlePageSize(s: number) { setPageSize(s); setPage(0) }

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
      <ListHeader
        title="Pagos"
        searchPlaceholder="Buscar por código..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPage={setPage}
        onPageSize={handlePageSize}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div> : (
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
                {recibos.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay pagos.</td></tr>
                ) : recibos.map(r => {
                  const anulado = r.notas === '[ANULADO]'
                  return (
                    <tr key={r.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{r.codigo}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#18181B]">{r.numero || '—'}</td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{r.proveedores?.nombre_razon_social || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(r.total)}</td>
                      <td className="px-4 py-3">{anulado ? <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">Anulado</span> : <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />Pagado</span>}</td>
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
        )}
      </div>
    </div>
  )
}