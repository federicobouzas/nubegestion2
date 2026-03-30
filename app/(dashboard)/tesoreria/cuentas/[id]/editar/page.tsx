'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import CuentaForm from '@/components/tesoreria/CuentaForm'
import { getCuenta, updateCuenta } from '@/lib/cuentas'
import type { Cuenta, CuentaForm as CuentaFormData } from '@/types/cuentas'

export default function EditarCuentaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cuenta, setCuenta] = useState<Cuenta | null>(null)

  useEffect(() => {
    getCuenta(id).then((d) => setCuenta(d as Cuenta))
  }, [id])

  async function handleSubmit(data: CuentaFormData) {
    await updateCuenta(id, data)
    router.push('/tesoreria/cuentas')
  }

  if (!cuenta)
    return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuentas', href: '/tesoreria/cuentas' }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Cuenta</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <CuentaForm
          initialData={{ nombre: cuenta.nombre, tipo: cuenta.tipo, activo: cuenta.activo }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
