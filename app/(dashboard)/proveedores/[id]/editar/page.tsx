'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ContactoForm, { ContactoFormData } from '@/components/shared/ContactoForm'
import { getProveedor, updateProveedor } from '@/lib/proveedores'
import type { Proveedor } from '@/types/proveedores'

export default function EditarProveedorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [c, setC] = useState<Proveedor | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getProveedor(id).then(setC).catch(console.error).finally(() => setLoading(false)) }, [id])
  async function handleSubmit(data: ContactoFormData) { await updateProveedor(id, data as any); router.push('/proveedores') }
  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!c) return null
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Proveedores', href: '/proveedores' }, { label: c.nombre_razon_social, href: `/proveedores/${id}` }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0"><h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Proveedor</h1></div>
      <div className="flex-1 overflow-y-auto"><ContactoForm initialData={c} onSubmit={handleSubmit} submitLabel="Guardar cambios" /></div>
    </div>
  )
}
