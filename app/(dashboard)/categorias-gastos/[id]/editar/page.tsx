'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import CategoriaGastoForm from '@/components/gastos/CategoriaGastoForm'
import { getCategoriaGasto, updateCategoriaGasto } from '@/lib/gastos'

export default function EditarCategoriaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<any>(null)
  useEffect(() => { getCategoriaGasto(id).then(setItem) }, [id])
  async function handleSubmit(data: any) {
    await updateCategoriaGasto(id, data)
    router.push('/categorias-gastos')
  }
  if (!item) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Categorías de Gastos', href: '/categorias-gastos' }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Categoría</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <CategoriaGastoForm initialData={item} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
      </div>
    </div>
  )
}
