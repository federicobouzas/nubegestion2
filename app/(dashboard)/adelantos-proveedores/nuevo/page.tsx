'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import AdelantoProveedorForm from '@/components/adelantos-proveedores/AdelantoProveedorForm'
import { createAdelantoProveedor } from '@/lib/adelantos-proveedores'
import type { AdelantoProveedorForm as AdelantoProveedorFormData } from '@/types/adelantos-proveedores'

export default function NuevoAdelantoProveedorPage() {
  const router = useRouter()

  async function handleSubmit(data: AdelantoProveedorFormData) {
    await createAdelantoProveedor(data)
    router.push('/adelantos-proveedores')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Adelantos de Proveedores', href: '/adelantos-proveedores' }, { label: 'Nuevo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Adelanto</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AdelantoProveedorForm onSubmit={handleSubmit} submitLabel="Crear adelanto" />
      </div>
    </div>
  )
}
