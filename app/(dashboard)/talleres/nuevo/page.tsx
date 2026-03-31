'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import TallerForm from '@/components/produccion/TallerForm'
import { createTaller } from '@/lib/produccion'
import type { TallerForm as ITallerForm } from '@/types/produccion'

export default function NuevoTallerPage() {
  const router = useRouter()

  async function handleSubmit(data: ITallerForm) {
    await createTaller(data)
    router.back()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[
        { label: 'Producción' },
        { label: 'Talleres', href: '/talleres' },
        { label: 'Nuevo' },
      ]} />
      <div className="flex-1 overflow-y-auto">
        <TallerForm onSubmit={handleSubmit} submitLabel="Crear Taller" />
      </div>
    </div>
  )
}
