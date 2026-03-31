'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import GastoForm from '@/components/gastos/GastoForm'
import { createGasto } from '@/lib/gastos'

export default function NuevoGastoPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    await createGasto(data)
    router.back()
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Gastos', href: '/gastos' }, { label: 'Nuevo gasto' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Gasto</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <GastoForm onSubmit={handleSubmit} submitLabel="Crear gasto" />
      </div>
    </div>
  )
}
