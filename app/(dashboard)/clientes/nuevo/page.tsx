'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ContactoForm, { ContactoFormData } from '@/components/shared/ContactoForm'
import { createCliente } from '@/lib/clientes'

export default function NuevoClientePage() {
  const router = useRouter()
  async function handleSubmit(data: ContactoFormData) { await createCliente(data as any); router.push('/clientes') }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Clientes', href: '/clientes' }, { label: 'Nuevo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0"><h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Cliente</h1></div>
      <div className="flex-1 min-h-0 overflow-y-auto"><ContactoForm onSubmit={handleSubmit} submitLabel="Guardar cliente" /></div>
    </div>
  )
}
