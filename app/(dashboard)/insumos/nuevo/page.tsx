'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import InsumoForm from '@/components/produccion/InsumoForm'
import { createInsumo } from '@/lib/produccion'
import type { InsumoForm as IInsumoForm } from '@/types/produccion'

export default function NuevoInsumoPage() {
  const router = useRouter()

  async function handleSubmit(data: IInsumoForm) {
    await createInsumo(data)
    router.back()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[
        { label: 'Producción' },
        { label: 'Insumos', href: '/insumos' },
        { label: 'Nuevo' },
      ]} />
      <div className="flex-1 overflow-y-auto">
        <InsumoForm onSubmit={handleSubmit} submitLabel="Crear Insumo" />
      </div>
    </div>
  )
}
