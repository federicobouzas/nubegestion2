'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getInsumo, deleteInsumo, getMovimientosInsumo } from '@/lib/produccion'
import { formatMonto } from '@/lib/gastos'
import type { Insumo } from '@/types/produccion'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-0.5">{label}</div>
      <div className="text-[12.5px] text-[#18181B]">{value}</div>
    </div>
  )
}

export default function InsumoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [insumo, setInsumo] = useState<Insumo | null>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      getInsumo(id),
      getMovimientosInsumo(id),
    ]).then(([ins, movs]) => {
      setInsumo(ins)
      setMovimientos(movs || [])
    }).finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('¿Eliminar este insumo?')) return
    setDeleting(true)
    try {
      await deleteInsumo(id)
      router.push('/insumos')
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar.')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Insumos', href: '/insumos' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  if (!insumo) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Insumos', href: '/insumos' }, { label: 'No encontrado' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Insumo no encontrado.</div>
    </div>
  )

  const activo = insumo.estado === 'activo'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[
          { label: 'Producción' },
          { label: 'Insumos', href: '/insumos' },
          { label: insumo.nombre },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/insumos/${id}/editar`}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
            >
              <Pencil size={13} strokeWidth={2} /> Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] border border-[#FEE8E8] bg-[#FEE8E8] text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} strokeWidth={2} /> Eliminar
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Info */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Row label="Nombre" value={<span className="font-bold text-[14px]">{insumo.nombre}</span>} />
            </div>
            <Row label="Estado" value={
              <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${activo ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#FEE8E8] text-[#7F1D1D]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-[#4EBB7F]' : 'bg-[#EE3232]'}`} />
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            } />
            <Row label="Proveedor" value={insumo.proveedores?.nombre_razon_social || '—'} />
            <Row label="Unidad de Medida" value={insumo.unidad_medida} />
            <Row label="IVA" value={`${insumo.iva}%`} />
            <Row label="Precio de Compra" value={<span className="font-mono font-bold">{formatMonto(Number(insumo.precio_compra))}</span>} />
            <Row label="Stock" value={<span className="font-mono font-bold text-[14px]">{Number(insumo.stock).toLocaleString('es-AR')}</span>} />
            <Row label="Fecha de Alta" value={<span className="font-mono text-[11px] text-[#6B6762]">{new Date(insumo.created_at).toLocaleDateString('es-AR')}</span>} />
            {insumo.observaciones && (
              <div className="col-span-3">
                <Row label="Observaciones" value={insumo.observaciones} />
              </div>
            )}
          </div>
        </div>

        {/* Movimientos */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Últimos Movimientos</span>
          </div>
          {movimientos.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">Sin movimientos registrados.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Fecha', 'Descripción', 'Entrada', 'Salida'].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m: any) => (
                  <tr key={m.id} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-4 py-2 font-mono text-[11px] text-[#6B6762]">
                      {new Date(m.fecha_movimiento).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-2 text-[12px] text-[#6B6762]">{m.descripcion}</td>
                    <td className="px-4 py-2 font-mono text-[12px] text-[#1A5C38] font-bold">
                      {Number(m.entrada) > 0 ? `+${Number(m.entrada).toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[12px] text-[#EE3232] font-bold">
                      {Number(m.salida) > 0 ? `-${Number(m.salida).toLocaleString('es-AR')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
