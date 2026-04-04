'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import AdelantoClienteForm from '@/components/adelantos-clientes/AdelantoClienteForm'
import { getAdelantoCliente, updateAdelantoCliente } from '@/lib/adelantos-clientes'
import type { AdelantoClienteForm as AdelantoClienteFormData } from '@/types/adelantos-clientes'

export default function AdelantoClientePage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const editMode = searchParams.get('editar') === '1'

  const [adelanto, setAdelanto] = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getAdelantoCliente(id).then(d => { setAdelanto(d); setLoading(false) })
  }, [id])

  async function handleSubmit(data: AdelantoClienteFormData) {
    await updateAdelantoCliente(id, data)
    router.push('/adelantos-clientes')
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Adelantos de Clientes', href: '/adelantos-clientes' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  if (!adelanto) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Adelantos de Clientes', href: '/adelantos-clientes' }, { label: 'No encontrado' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Adelanto no encontrado.</div>
    </div>
  )

  const fueConsumido = Number(adelanto.importe) !== Number(adelanto.importe_original)
  const isReadonly = !editMode || fueConsumido

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[
          { label: 'Adelantos de Clientes', href: '/adelantos-clientes' },
          { label: adelanto.clientes?.nombre_razon_social ?? 'Adelanto' },
        ]}
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">
          {isReadonly ? 'Ver Adelanto' : 'Editar Adelanto'}
        </h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AdelantoClienteForm
          initialData={{
            cliente_id: adelanto.cliente_id,
            cuenta_id:  adelanto.cuenta_id,
            fecha:      adelanto.fecha,
            importe:    Number(adelanto.importe_original),
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
