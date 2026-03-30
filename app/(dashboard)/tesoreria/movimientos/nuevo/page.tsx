'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import MovimientoForm from '@/components/movimientos/MovimientoForm'
import { createMovimiento } from '@/lib/movimientos'

export default function NuevoMovimientoPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    await createMovimiento(data)
    router.push('/tesoreria/movimientos')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Tesorería' }, { label: 'Movimientos', href: '/tesoreria/movimientos' }, { label: 'Nuevo movimiento' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Movimiento</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MovimientoForm onSubmit={handleSubmit} submitLabel="Crear movimiento" />
      </div>
    </div>
  )
}
