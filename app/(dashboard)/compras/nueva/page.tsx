'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import FacturaCompraForm from '@/components/compras/FacturaCompraForm'
import { createFacturaCompra } from '@/lib/compras'

export default function NuevaCompraPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    await createFacturaCompra(data)
    router.back()
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Compras', href: '/compras' }, { label: 'Nueva factura' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nueva Compra</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <FacturaCompraForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
