'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import InsumoForm from '@/components/produccion/InsumoForm'
import { getInsumo, updateInsumo } from '@/lib/produccion'
import type { Insumo, InsumoForm as IInsumoForm } from '@/types/produccion'

export default function EditarInsumoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [insumo, setInsumo] = useState<Insumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInsumo(id).then(setInsumo).finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data: IInsumoForm) {
    await updateInsumo(id, data)
    router.back()
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Insumos', href: '/insumos' }, { label: 'Editar' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[
        { label: 'Producción' },
        { label: 'Insumos', href: '/insumos' },
        { label: insumo?.nombre || '...', href: `/insumos/${id}` },
        { label: 'Editar' },
      ]} />
      <div className="flex-1 overflow-y-auto">
        <InsumoForm
          initialData={insumo ? {
            nombre: insumo.nombre,
            precio_compra: insumo.precio_compra,
            unidad_medida: insumo.unidad_medida,
            proveedor_id: insumo.proveedor_id ?? '',
            iva: insumo.iva,
            estado: insumo.estado,
            observaciones: insumo.observaciones ?? '',
          } : undefined}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
