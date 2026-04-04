'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import AdelantoProveedorForm from '@/components/adelantos-proveedores/AdelantoProveedorForm'
import { getAdelantoProveedor, updateAdelantoProveedor } from '@/lib/adelantos-proveedores'
import type { AdelantoProveedorForm as AdelantoProveedorFormData } from '@/types/adelantos-proveedores'

export default function AdelantoProveedorPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const editMode = searchParams.get('editar') === '1'

  const [adelanto, setAdelanto] = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getAdelantoProveedor(id).then(d => { setAdelanto(d); setLoading(false) })
  }, [id])

  async function handleSubmit(data: AdelantoProveedorFormData) {
    await updateAdelantoProveedor(id, data)
    router.push('/adelantos-proveedores')
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Adelantos de Proveedores', href: '/adelantos-proveedores' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  if (!adelanto) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Adelantos de Proveedores', href: '/adelantos-proveedores' }, { label: 'No encontrado' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Adelanto no encontrado.</div>
    </div>
  )

  const fueConsumido = Number(adelanto.importe) !== Number(adelanto.importe_original)
  const isReadonly = !editMode || fueConsumido

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[
          { label: 'Adelantos de Proveedores', href: '/adelantos-proveedores' },
          { label: adelanto.proveedores?.nombre_razon_social ?? 'Adelanto' },
        ]}
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">
          {isReadonly ? 'Ver Adelanto' : 'Editar Adelanto'}
        </h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AdelantoProveedorForm
          initialData={{
            proveedor_id: adelanto.proveedor_id,
            cuenta_id:    adelanto.cuenta_id,
            fecha:        adelanto.fecha,
            importe:      Number(adelanto.importe_original),
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          readonly={isReadonly}
          importeOriginal={fueConsumido ? Number(adelanto.importe_original) : undefined}
          importeDisponible={fueConsumido ? Number(adelanto.importe) : undefined}
        />
      </div>
    </div>
  )
}
