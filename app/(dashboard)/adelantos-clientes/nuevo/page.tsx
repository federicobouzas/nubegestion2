'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import AdelantoClienteForm from '@/components/adelantos-clientes/AdelantoClienteForm'
import { createAdelantoCliente } from '@/lib/adelantos-clientes'
import type { AdelantoClienteForm as AdelantoClienteFormData } from '@/types/adelantos-clientes'

export default function NuevoAdelantoClientePage() {
  const router = useRouter()

  async function handleSubmit(data: AdelantoClienteFormData) {
    await createAdelantoCliente(data)
    router.push('/adelantos-clientes')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Adelantos de Clientes', href: '/adelantos-clientes' }, { label: 'Nuevo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Adelanto</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AdelantoClienteForm onSubmit={handleSubmit} submitLabel="Crear adelanto" />
      </div>
    </div>
  )
}
