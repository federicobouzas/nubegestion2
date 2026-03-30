'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ReciboCobroForm from '@/components/cobros/ReciboCobroForm'
import { createReciboCobro } from '@/lib/cobros'
import type { ReciboCobroForm as ReciboCobroFormData } from '@/types/cobros'

export default function NuevoCobroPage() {
  const router = useRouter()
  async function handleSubmit(data: ReciboCobroFormData) {
    await createReciboCobro(data)
    router.push('/cobros')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cobros', href: '/cobros' }, { label: 'Nuevo recibo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Cobro</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ReciboCobroForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
