'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ContactoForm, { ContactoFormData } from '@/components/shared/ContactoForm'
import { createProveedor } from '@/lib/proveedores'

export default function NuevoProveedorPage() {
  const router = useRouter()
  async function handleSubmit(data: ContactoFormData) { await createProveedor(data as any); router.push('/proveedores') }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Proveedores', href: '/proveedores' }, { label: 'Nuevo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0"><h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Proveedor</h1></div>
      <div className="flex-1 overflow-y-auto"><ContactoForm initialData={{ condicion_iva: 'RI', tipo_factura: 'A' }} onSubmit={handleSubmit} submitLabel="Guardar proveedor" /></div>
    </div>
  )
}
