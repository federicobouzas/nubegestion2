'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import OtroIngresoForm from '@/components/otros-ingresos/OtroIngresoForm'
import { createOtroIngreso } from '@/lib/otros-ingresos'
import type { OtroIngresoForm as OtroIngresoFormData } from '@/types/otros-ingresos'

export default function NuevoOtroIngresoPage() {
  const router = useRouter()
  async function handleSubmit(data: OtroIngresoFormData) {
    await createOtroIngreso(data)
    router.push('/otros-ingresos')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Otros Ingresos', href: '/otros-ingresos' }, { label: 'Nuevo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Ingreso</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <OtroIngresoForm onSubmit={handleSubmit} submitLabel="Crear ingreso" />
      </div>
    </div>
  )
}
