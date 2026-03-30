'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import OtroIngresoForm from '@/components/otros-ingresos/OtroIngresoForm'
import { getOtroIngreso, updateOtroIngreso } from '@/lib/otros-ingresos'
import type { OtroIngreso, OtroIngresoForm as OtroIngresoFormData } from '@/types/otros-ingresos'

export default function EditarOtroIngresoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<OtroIngreso | null>(null)

  useEffect(() => {
    getOtroIngreso(id).then((d) => setItem(d as OtroIngreso))
  }, [id])

  async function handleSubmit(data: OtroIngresoFormData) {
    await updateOtroIngreso(id, data)
    router.push('/otros-ingresos')
  }

  if (!item)
    return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Otros Ingresos', href: '/otros-ingresos' }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Ingreso</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <OtroIngresoForm
          initialData={{
            fecha: item.fecha,
            tipo: item.tipo,
            descripcion: item.descripcion ?? '',
            cuenta_id: item.cuenta_id,
            importe: Number(item.importe),
            notas: item.notas ?? '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
