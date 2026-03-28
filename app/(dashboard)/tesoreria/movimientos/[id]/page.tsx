'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import MovimientoForm from '@/components/movimientos/MovimientoForm'
import { getMovimiento, updateMovimiento, deleteMovimiento } from '@/lib/movimientos'
import type { MovimientoCuentaForm } from '@/types/movimientos'

export default function MovimientoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [movimiento, setMovimiento] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMovimiento(id)
      .then(d => setMovimiento(d))
      .catch(() => router.push('/tesoreria/movimientos'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data: MovimientoCuentaForm) {
    await updateMovimiento(id, data)
    router.push('/tesoreria/movimientos')
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return
    await deleteMovimiento(id)
    router.push('/tesoreria/movimientos')
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar breadcrumb={[{ label: 'Tesorería' }, { label: 'Movimientos', href: '/tesoreria/movimientos' }, { label: '...' }]} />
        <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
      </div>
    )
  }

  if (!movimiento) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Tesorería' }, { label: 'Movimientos', href: '/tesoreria/movimientos' }, { label: 'Editar movimiento' }]}
        actions={
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] border border-[#EE3232] text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"
          >
            <Trash2 size={13} strokeWidth={2.2} /> Eliminar
          </button>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Movimiento</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MovimientoForm
          initialData={{
            cuenta_origen_id: movimiento.cuenta_origen_id,
            cuenta_destino_id: movimiento.cuenta_destino_id,
            fecha: movimiento.fecha,
            monto: movimiento.monto,
            observacion: movimiento.observacion || '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
