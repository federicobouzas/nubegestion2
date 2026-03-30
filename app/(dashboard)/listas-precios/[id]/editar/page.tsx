'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ListaPrecioForm from '@/components/listas-precios/ListaPrecioForm'
import { getListaPrecio, updateListaPrecio } from '@/lib/listas-precios'

export default function EditarListaPrecioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<any>(null)

  useEffect(() => { getListaPrecio(id).then(setItem) }, [id])

  async function handleSubmit(data: any) {
    await updateListaPrecio(id, data)
    router.push('/listas-precios')
  }

  if (!item) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Listas de Precios', href: '/listas-precios' }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Lista de Precios</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ListaPrecioForm initialData={item} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
      </div>
    </div>
  )
}
