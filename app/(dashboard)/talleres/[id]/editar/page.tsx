'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import TallerForm from '@/components/produccion/TallerForm'
import { getTaller, updateTaller } from '@/lib/produccion'
import type { Taller, TallerForm as ITallerForm } from '@/types/produccion'

export default function EditarTallerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTaller(id).then(setTaller).finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data: ITallerForm) {
    await updateTaller(id, data)
    router.back()
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Talleres', href: '/talleres' }, { label: 'Editar' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[
        { label: 'Producción' },
        { label: 'Talleres', href: '/talleres' },
        { label: taller?.nombre || '...', href: `/talleres/${id}` },
        { label: 'Editar' },
      ]} />
      <div className="flex-1 overflow-y-auto">
        <TallerForm
          initialData={taller ?? undefined}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
