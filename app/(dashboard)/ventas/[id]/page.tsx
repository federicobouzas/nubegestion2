'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, Send, Trash2, ArrowLeft } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ModalCAE from '@/components/ventas/ModalCAE'
import { getFacturaVenta, getItemsFacturaVenta, getPercepcionesFacturaVenta, grabarCAE, anularFacturaVenta, calcularEstado, formatMonto } from '@/lib/ventas'
import type { FacturaVenta, ItemFacturaVenta, PercepcionFactura } from '@/types/ventas'

export default function VerVentaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [f, setF] = useState<FacturaVenta | null>(null)
  const [items, setItems] = useState<ItemFacturaVenta[]>([])
  const [percepciones, setPercepciones] = useState<PercepcionFactura[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([getFacturaVenta(id), getItemsFacturaVenta(id), getPercepcionesFacturaVenta(id)])
      .then(([fv, it, pe]) => { setF(fv); setItems(it || []); setPercepciones(pe || []) })
      .catch(console.error).finally(() => setLoading(false))
  }, [id])

  async function handleGrabarCAE(cae: string, vto: string) {
    const updated = await grabarCAE(id, cae, vto)
    setF(updated); setShowModal(false)
  }

  async function handleAnular() {
    if (!confirm('¿Anular esta factura? Esta acción no se puede deshacer.')) return
    await anularFacturaVenta(id); router.push('/ventas')
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!f) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>

  const estado = calcularEstado(f.saldo_pendiente, f.fecha_vencimiento)
  const estadoStyle = { cobrada: 'bg-[#E8F7EF] text-[#1A5C38]', pendiente: 'bg-[#FEF8E1] text-[#7A5500]', vencida: 'bg-[#FEE8E8] text-[#7F1D1D]' }[estado]
  const estadoLabel = { cobrada: 'Cobrada', pendiente: 'Pendiente', vencida: 'Vencida' }[estado]
  const anulada = f.notas === '[ANULADA]'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Ventas', href: '/ventas' }, { label: f.codigo }]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><ArrowLeft size={12} strokeWidth={2.2} /> Volver</button>
            <Link href={`/ventas/${id}/imprimir`} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-white text-[#18181B] hover:border-[#A8A49D] transition-colors"><Printer size={12} strokeWidth={2.2} /> Imprimir</Link>
            {!f.cae && !anulada && <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] bg-[#2CBAF2] text-white hover:bg-[#1A9BD4] transition-colors"><Send size={12} strokeWidth={2.2} /> Enviar a AFIP</button>}
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-[#A8A49D]">{f.codigo}</span>
              <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] ${f.tipo === 'A' ? 'bg-[#DBEAFE] text-[#1E3A8A]' : f.tipo === 'B' ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F0EBFB] text-[#3D1F8A]'}`}>Factura {f.tipo}</span>
              {f.numero && <span className="font-mono text-[12px] font-bold text-[#18181B]">{f.numero}</span>}
              {anulada && <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">ANULADA</span>}
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${estadoStyle}`}>{estadoLabel}</span>
          </div>
          <div className="p-4 grid grid-cols-4 gap-3">
            {[
              ['Cliente', f.clientes?.nombre_razon_social || '—'],
              ['CUIT', f.clientes?.cuit || '—'],
              ['Fecha emisión', new Date(f.fecha_emision).toLocaleDateString('es-AR')],
              ['Vencimiento', f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString('es-AR') : '—'],
              ['Condición', f.condicion_venta],
              ['CAE', f.cae || '—'],
              ['Vto. CAE', f.cae_fecha_vencimiento ? new Date(f.cae_fecha_vencimiento).toLocaleDateString('es-AR') : '—'],
              ['Saldo', formatMonto(f.saldo_pendiente)],
            ].map(([l,v]) => (
              <div key={l} className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2.5">
                <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] mb-1">{l}</div>
                <div className="text-[12.5px] font-semibold text-[#18181B]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Ítems</span></div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                {['Descripción','Cant.','Precio Unit.','IVA','Desc.','Subtotal'].map((h,i) => (
                  <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-[#F1F0EE] last:border-0">
                  <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#18181B]">{it.descripcion}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{it.cantidad}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{formatMonto(it.precio_unitario)}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{it.iva_porcentaje}%</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">{it.descuento_porcentaje}%</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#E5E4E0] p-4 flex flex-col items-end gap-1.5">
            <div className="flex gap-8 text-[12px] text-[#6B6762]"><span>Subtotal neto</span><span className="font-mono font-bold text-[#18181B] w-28 text-right">{formatMonto(f.subtotal)}</span></div>
            {f.impuestos > 0 && <div className="flex gap-8 text-[12px] text-[#6B6762]"><span>IVA</span><span className="font-mono font-bold text-[#18181B] w-28 text-right">{formatMonto(f.impuestos)}</span></div>}
            {f.percepciones > 0 && <div className="flex gap-8 text-[12px] text-[#6B6762]"><span>Percepciones</span><span className="font-mono font-bold text-[#18181B] w-28 text-right">{formatMonto(f.percepciones)}</span></div>}
            <div className="flex gap-8 text-[14px] font-bold border-t border-[#E5E4E0] pt-2 mt-1"><span>Total</span><span className="font-mono text-[#F2682E] w-28 text-right text-[16px]">{formatMonto(f.total)}</span></div>
          </div>
        </div>

        {/* Anular */}
        {!anulada && (
          <div className="pt-2 border-t border-[#E5E4E0]">
            <button onClick={handleAnular} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors">
              <Trash2 size={13} strokeWidth={2} /> Anular factura
            </button>
          </div>
        )}
      </div>
      {showModal && f && <ModalCAE factura={f} onConfirm={handleGrabarCAE} onClose={() => setShowModal(false)} />}
    </div>
  )
}
