'use client'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/shared/Topbar'
import CuentaForm from '@/components/tesoreria/CuentaForm'
import { createCuenta } from '@/lib/cuentas'
import type { CuentaForm as CuentaFormData } from '@/types/cuentas'

export default function NuevaCuentaPage() {
  const router = useRouter()
  async function handleSubmit(data: CuentaFormData) {
    await createCuenta(data)
    router.push('/tesoreria/cuentas')
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuentas', href: '/tesoreria/cuentas' }, { label: 'Nueva cuenta' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nueva Cuenta</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <CuentaForm onSubmit={handleSubmit} submitLabel="Crear cuenta" />
      </div>
    </div>
  )
}
