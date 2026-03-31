'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import FabricacionForm from '@/components/produccion/FabricacionForm'
import { createFabricacion } from '@/lib/produccion'
import type { FabricacionForm as IFabricacionForm } from '@/types/produccion'

export default function NuevaFabricacionPage() {
  const router = useRouter()

  async function handleSubmit(data: IFabricacionForm) {
    const fab = await createFabricacion(data)
    router.push(`/fabricacion/${fab.id}`)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[
        { label: 'Producción' },
        { label: 'Fabricación', href: '/fabricacion' },
        { label: 'Nueva' },
      ]} />
      <div className="flex-1 overflow-y-auto">
        <FabricacionForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
