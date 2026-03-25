'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import FacturaForm from '@/components/ventas/FacturaForm'
import { createFacturaVenta } from '@/lib/ventas'

export default function NuevaVentaPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    const f = await createFacturaVenta(data)
    router.push('/ventas')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Ventas', href: '/ventas' }, { label: 'Nueva factura' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nueva Venta</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FacturaForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
