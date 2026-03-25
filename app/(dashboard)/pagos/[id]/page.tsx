'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Printer } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getReciboPago, getMetodosPago, getFacturasPago, getRetencionesPago, anularReciboPago, formatMonto } from '@/lib/pagos'

export default function VerPagoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [r, setR] = useState<any>(null)
  const [metodos, setMetodos] = useState<any[]>([])
  const [facturas, setFacturas] = useState<any[]>([])
  const [retenciones, setRetenciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getReciboPago(id), getMetodosPago(id), getFacturasPago(id), getRetencionesPago(id)])
      .then(([rp, m, f, ret]) => { setR(rp); setMetodos(m || []); setFacturas(f || []); setRetenciones(ret || []) })
      .catch(console.error).finally(() => setLoading(false))
  }, [id])

  async function handleAnular() {
    if (!confirm('¿Anular este recibo de pago? Las facturas recuperarán su saldo.')) return
    await anularReciboPago(id)
    router.push('/pagos')
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!r) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>

  const anulado = r.notas === '[ANULADO]'
  const totalRetenciones = retenciones.reduce((a: number, r: any) => a + Number(r.importe), 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Pagos', href: '/pagos' }, { label: r.codigo }]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.push('/pagos')} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors">
              <ArrowLeft size={12} strokeWidth={2.2} /> Volver
            </button>
            <button onClick={() => window.open(`/pagos/${id}/imprimir`, '_blank')} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-white text-[#18181B] hover:border-[#A8A49D] transition-colors">
              <Printer size={12} strokeWidth={2.2} /> Imprimir
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-[#A8A49D]">{r.codigo}</span>
              {r.numero && <span className="font-mono text-[12px] font-bold text-[#18181B]">N° {r.numero}</span>}
              {anulado && <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">ANULADO</span>}
            </div>
            {!anulado && <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />Pagado</span>}
          </div>
          <div className="p-4 grid grid-cols-4 gap-3">
            {[
              ['Proveedor', r.proveedores?.nombre_razon_social || '—'],
              ['CUIT', r.proveedores?.cuit || '—'],
              ['Fecha', new Date(r.fecha).toLocaleDateString('es-AR')],
              ['Total', formatMonto(r.total)],
            ].map(([l,v]) => (
              <div key={l} className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2.5">
                <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] mb-1">{l}</div>
                <div className="text-[12.5px] font-semibold text-[#18181B]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Facturas pagadas</span></div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                {['Factura','Total','Importe pagado'].map((h,i) => (
                  <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturas.map((f: any, i: number) => (
                <tr key={i} className="border-b border-[#F1F0EE] last:border-0">
                  <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">{f.facturas_compra?.numero || f.facturas_compra?.codigo || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{f.facturas_compra ? formatMonto(f.facturas_compra.total) : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(f.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Métodos de pago</span></div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                {['Cuenta','Monto'].map((h,i) => (
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
        </div>

        {retenciones.length > 0 && (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Retenciones</span></div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Impuesto','N° Comprobante','Fecha','Importe'].map((h,i) => (
                    <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retenciones.map((ret: any, i: number) => (
                  <tr key={i} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#18181B]">{ret.impuesto}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{ret.numero_comprobante || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{ret.fecha ? new Date(ret.fecha).toLocaleDateString('es-AR') : '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(ret.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!anulado && (
          <div className="pt-2 border-t border-[#E5E4E0]">
            <button onClick={handleAnular} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors">
              <Trash2 size={13} strokeWidth={2} /> Anular pago
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
