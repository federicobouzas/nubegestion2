'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ReciboPagoForm from '@/components/pagos/ReciboPagoForm'
import { createReciboPago } from '@/lib/pagos'

export default function NuevoPagoPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    await createReciboPago(data)
    router.push('/pagos')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Pagos', href: '/pagos' }, { label: 'Nuevo pago' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Pago</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ReciboPagoForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
