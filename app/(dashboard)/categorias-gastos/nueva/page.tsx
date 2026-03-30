'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import CategoriaGastoForm from '@/components/gastos/CategoriaGastoForm'
import { createCategoriaGasto } from '@/lib/gastos'

export default function NuevaCategoriaPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    await createCategoriaGasto(data)
    router.push('/categorias-gastos')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Categorías de Gastos', href: '/categorias-gastos' }, { label: 'Nueva' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nueva Categoría</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <CategoriaGastoForm onSubmit={handleSubmit} submitLabel="Crear categoría" />
      </div>
    </div>
  )
}
