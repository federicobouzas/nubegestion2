'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ListaPrecioForm from '@/components/listas-precios/ListaPrecioForm'
import { createListaPrecio } from '@/lib/listas-precios'

export default function NuevaListaPrecioPage() {
  const router = useRouter()
  async function handleSubmit(data: any) {
    await createListaPrecio(data)
    router.push('/listas-precios')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Listas de Precios', href: '/listas-precios' }, { label: 'Nueva' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nueva Lista de Precios</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ListaPrecioForm onSubmit={handleSubmit} submitLabel="Crear lista" />
      </div>
    </div>
  )
}
