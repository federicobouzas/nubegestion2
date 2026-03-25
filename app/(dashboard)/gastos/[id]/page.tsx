'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getGasto, getMetodosGasto, deleteGasto, formatMonto } from '@/lib/gastos'

export default function VerGastoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [g, setG] = useState<any>(null)
  const [metodos, setMetodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getGasto(id), getMetodosGasto(id)])
      .then(([gasto, m]) => { setG(gasto); setMetodos(m || []) })
      .catch(console.error).finally(() => setLoading(false))
  }, [id])

  async function handleAnular() {
    if (!confirm('¿Anular este gasto?')) return
    await deleteGasto(id)
    router.push('/gastos')
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!g) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>

  const anulado = g.notas === '[ANULADO]'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Gastos', href: '/gastos' }, { label: g.codigo }]}
        actions={
          <button onClick={() => router.push('/gastos')} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors">
            <ArrowLeft size={12} strokeWidth={2.2} /> Volver
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-[#A8A49D]">{g.codigo}</span>
              {anulado && <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">ANULADO</span>}
            </div>
            {!anulado && <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />Pagado</span>}
          </div>
          <div className="p-4 grid grid-cols-4 gap-3">
            {[
              ['Categoría', g.categorias_gastos ? `${g.categorias_gastos.tipo} > ${g.categorias_gastos.descripcion}` : '—'],
              ['Fecha pago', new Date(g.fecha_pago).toLocaleDateString('es-AR')],
              ['Descripción', g.descripcion || '—'],
              ['Nro. factura', g.numero_factura || '—'],
              ['Total', formatMonto(g.total)],
            ].map(([l,v]) => (
              <div key={l} className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2.5">
                <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] mb-1">{l}</div>
                <div className="text-[12.5px] font-semibold text-[#18181B]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Métodos de pago</span></div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                {['Cuenta','Importe'].map((h,i) => (
                  <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metodos.map((m: any, i: number) => (
                <tr key={i} className="border-b border-[#F1F0EE] last:border-0">
                  <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#18181B]">{m.cuentas?.nombre || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(m.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#E5E4E0] p-4 flex justify-end">
            <div className="flex gap-8 text-[14px] font-bold">
              <span>Total</span>
              <span className="font-mono text-[#F2682E] w-28 text-right text-[16px]">{formatMonto(g.total)}</span>
            </div>
          </div>
        </div>

        {!anulado && (
          <div className="pt-2 border-t border-[#E5E4E0]">
            <button onClick={handleAnular} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors">
              <Trash2 size={13} strokeWidth={2} /> Anular gasto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
