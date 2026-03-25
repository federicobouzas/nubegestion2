'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import ContactoForm, { ContactoFormData } from '@/components/shared/ContactoForm'
import { getCliente, updateCliente } from '@/lib/clientes'
import type { Cliente } from '@/types/clientes'

function clienteToInitial(c: Cliente): Partial<ContactoFormData> {
  return {
    nombre_razon_social: c.nombre_razon_social,
    cuit: c.cuit ?? '',
    condicion_iva: c.condicion_iva,
    domicilio_fiscal: c.domicilio_fiscal ?? '',
    direccion: c.direccion ?? '',
    localidad: c.localidad ?? '',
    provincia: c.provincia ?? '',
    codigo_postal: c.codigo_postal ?? '',
    telefono: c.telefono ?? '',
    email: c.email ?? '',
    web: c.web ?? '',
    tipo_factura: c.tipo_factura,
    estado: c.estado,
  }
}

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [c, setC] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getCliente(id).then(setC).catch(console.error).finally(() => setLoading(false)) }, [id])
  async function handleSubmit(data: ContactoFormData) { await updateCliente(id, data as any); router.push('/clientes') }
  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!c) return null
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Clientes', href: '/clientes' }, { label: c.nombre_razon_social, href: `/clientes/${id}` }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0"><h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Cliente</h1></div>
      <div className="flex-1 overflow-y-auto"><ContactoForm initialData={clienteToInitial(c)} onSubmit={handleSubmit} submitLabel="Guardar cambios" /></div>
    </div>
  )
}
