'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getFabricacion, getFabricacionProductos, finalizarFabricacion } from '@/lib/produccion'
import { formatMonto } from '@/lib/gastos'
import type { Fabricacion, FabricacionProducto } from '@/types/produccion'

function EstadoBadge({ estado }: { estado: string }) {
  const cfg =
    estado === 'finalizado'
      ? { bg: 'bg-[#E8F7EF]', text: 'text-[#1A5C38]', dot: 'bg-[#4EBB7F]', label: 'Finalizado' }
      : { bg: 'bg-[#FEF9EC]', text: 'text-[#92400E]', dot: 'bg-[#F59E0B]', label: 'En proceso' }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-0.5">{label}</div>
      <div className="text-[12.5px] text-[#18181B]">{value}</div>
    </div>
  )
}

export default function FabricacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [fab, setFab] = useState<Fabricacion | null>(null)
  const [productos, setProductos] = useState<FabricacionProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)

  const loadData = useCallback(async () => {
    const [f, ps] = await Promise.all([getFabricacion(id), getFabricacionProductos(id)])
    setFab(f as Fabricacion)
    setProductos((ps || []) as FabricacionProducto[])
  }, [id])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [loadData])

  async function handleFinalizar() {
    if (!confirm('¿Finalizar esta fabricación? Se descontará stock de insumos y se sumará stock a los productos.')) return
    setFinalizing(true)
    try {
      await finalizarFabricacion(id)
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Error al finalizar.')
    } finally {
      setFinalizing(false)
    }
  }

  const costoTotal = productos.reduce((a, p) => a + Number(p.costo_total), 0)

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Fabricación', href: '/fabricacion' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  if (!fab) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Fabricación', href: '/fabricacion' }, { label: 'No encontrado' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Fabricación no encontrada.</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[
          { label: 'Producción' },
          { label: 'Fabricación', href: '/fabricacion' },
          { label: fab.codigo },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              href="/fabricacion"
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
            >
              <ArrowLeft size={13} strokeWidth={2} /> Volver
            </Link>
            {fab.estado === 'en_proceso' && (
              <button
                onClick={handleFinalizar}
                disabled={finalizing}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
              >
                <CheckCircle size={13} strokeWidth={2} /> {finalizing ? 'Finalizando...' : 'Finalizar Fabricación'}
              </button>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Header info */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-4 gap-4">
            <InfoRow label="Código" value={<span className="font-mono font-bold">{fab.codigo}</span>} />
            <InfoRow label="Taller" value={(fab as any).talleres?.nombre || '—'} />
            <InfoRow label="Estado" value={<EstadoBadge estado={fab.estado} />} />
            <InfoRow label="Fecha de Alta" value={<span className="font-mono text-[11px] text-[#6B6762]">{new Date(fab.created_at).toLocaleDateString('es-AR')}</span>} />
            <InfoRow label="Fecha Fabricación" value={<span className="font-mono text-[11px] text-[#6B6762]">{new Date(fab.fecha_fabricacion).toLocaleDateString('es-AR')}</span>} />
            <InfoRow label="Fecha Est. Finalización" value={
              <span className="font-mono text-[11px] text-[#6B6762]">
                {fab.fecha_estimada_finalizacion ? new Date(fab.fecha_estimada_finalizacion).toLocaleDateString('es-AR') : '—'}
              </span>
            } />
            <InfoRow label="Fecha Finalización" value={
              <span className="font-mono text-[11px] text-[#6B6762]">
                {fab.fecha_finalizacion ? new Date(fab.fecha_finalizacion).toLocaleDateString('es-AR') : '—'}
              </span>
            } />
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Productos en Producción</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                {['Producto', 'Cantidad', 'Costo Insumos/u', 'Costo Fabricación/u', 'Costo Total', 'Observaciones'].map((h, i) => (
                  <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">Sin productos.</td></tr>
              ) : productos.map((p: any) => (
                <tr key={p.id} className="border-b border-[#F1F0EE] last:border-0">
                  <td className="px-4 py-3 text-[12px] text-[#18181B] font-medium">{p.productos?.nombre}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{p.cantidad}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{formatMonto(Number(p.costo_insumos))}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{formatMonto(Number(p.costo_fabricacion))}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(Number(p.costo_total))}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B6762]">{p.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#F1F0EE] flex justify-end">
            <div className="flex gap-8 text-[14px] font-bold">
              <span className="text-[#6B6762]">Costo Total</span>
              <span className="font-mono text-[#F2682E] text-[16px]">{formatMonto(costoTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
