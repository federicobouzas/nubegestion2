'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'
import { getCuentas } from '@/lib/cuentas'
import Topbar from '@/components/shared/Topbar'

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

interface CuentaConSaldo {
  id: string
  nombre: string
  tipo: string
  activo: boolean
  saldo_actual: number
}

export default function SaldosPage() {
  const [cuentas, setCuentas] = useState<CuentaConSaldo[]>([])
  const [totalACobrar, setTotalACobrar] = useState(0)
  const [totalAPagar, setTotalAPagar] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const tenantId = await getTenantId()

        const [cuentasData, ccCli, ccProv] = await Promise.all([
          getCuentas({ activo: true }),
          supabase.rpc('get_cc_clientes', { p_tenant_id: tenantId }),
          supabase.rpc('get_cc_proveedores', { p_tenant_id: tenantId }),
        ])

        setCuentas((cuentasData || []) as CuentaConSaldo[])
        setTotalACobrar((ccCli.data || []).reduce((a: number, c: any) => a + Number(c.saldo), 0))
        setTotalAPagar((ccProv.data || []).reduce((a: number, p: any) => a + Number(p.saldo), 0))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cajas = cuentas.filter(c => c.tipo === 'efectivo')
  const bancos = cuentas.filter(c => c.tipo === 'banco')
  const cuentasACobrar = cuentas.filter(c => c.tipo === 'a_cobrar')
  const cuentasAPagar = cuentas.filter(c => c.tipo === 'a_pagar')

  const totalCajas = cajas.reduce((a, c) => a + c.saldo_actual, 0)
  const totalBancos = bancos.reduce((a, c) => a + c.saldo_actual, 0)
  const totalCuentasACobrar = cuentasACobrar.reduce((a, c) => a + c.saldo_actual, 0)
  const totalCuentasAPagar = cuentasAPagar.reduce((a, c) => a + c.saldo_actual, 0)
  const granTotalACobrar = totalACobrar + totalCuentasACobrar
  const granTotalAPagar = totalAPagar + totalCuentasAPagar

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar breadcrumb={[{ label: 'Tesorería' }, { label: 'Saldos' }]} />
        <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Tesorería' }, { label: 'Saldos' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Cuentas Corrientes: A Cobrar / A Pagar */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">A Cobrar</span>
              <span className="font-mono text-[13px] font-bold text-[#1A5C38]">{formatMonto(granTotalACobrar)}</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center py-2.5 border-b border-[#F9F9F8]">
                <span className="text-[12.5px] text-[#18181B]">Saldo Cta. Cte. Clientes</span>
                <span className="font-mono text-[12px] font-medium text-[#6B6762]">{formatMonto(totalACobrar)}</span>
              </div>
              {cuentasACobrar.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2.5 border-b border-[#F9F9F8] last:border-0">
                  <span className="text-[12.5px] text-[#18181B]">{c.nombre}</span>
                  <span className="font-mono text-[12px] font-medium text-[#6B6762]">{formatMonto(c.saldo_actual)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">A Pagar</span>
              <span className="font-mono text-[13px] font-bold text-[#EE3232]">{formatMonto(granTotalAPagar)}</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center py-2.5 border-b border-[#F9F9F8]">
                <span className="text-[12.5px] text-[#18181B]">Saldo Cta. Cte. Proveedores</span>
                <span className="font-mono text-[12px] font-medium text-[#6B6762]">{formatMonto(totalAPagar)}</span>
              </div>
              {cuentasAPagar.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2.5 border-b border-[#F9F9F8] last:border-0">
                  <span className="text-[12.5px] text-[#18181B]">{c.nombre}</span>
                  <span className="font-mono text-[12px] font-medium text-[#6B6762]">{formatMonto(c.saldo_actual)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disponible: Cajas y Bancos */}
        <div className="grid grid-cols-2 gap-4">
          <SaldoCard
            title="Cajas"
            cuentas={cajas}
            total={totalCajas}
            totalColor="text-[#1A9BD4]"
            emptyMessage="No hay cajas."
          />
          <SaldoCard
            title="Bancos"
            cuentas={bancos}
            total={totalBancos}
            totalColor="text-[#1A9BD4]"
            emptyMessage="No hay cuentas bancarias."
          />
        </div>

      </div>
    </div>
  )
}

function SaldoCard({
  title, cuentas, total, totalColor, emptyMessage
}: {
  title: string
  cuentas: CuentaConSaldo[]
  total: number
  totalColor: string
  emptyMessage: string
}) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
        <span className="font-display text-[13.5px] font-bold">{title}</span>
        {cuentas.length > 0 && (
          <span className={`font-mono text-[13px] font-bold ${totalColor}`}>{formatMonto(total)}</span>
        )}
      </div>
      <div className="p-4">
        {cuentas.length === 0 ? (
          <div className="text-[12px] text-[#A8A49D] py-2">{emptyMessage}</div>
        ) : (
          <div className="flex flex-col">
            {cuentas.map(c => (
              <div key={c.id} className="flex justify-between items-center py-2.5 border-b border-[#F9F9F8] last:border-0">
                <span className="text-[12.5px] text-[#18181B]">{c.nombre}</span>
                <span className={`font-mono text-[12px] font-medium ${c.saldo_actual < 0 ? 'text-[#EE3232]' : 'text-[#6B6762]'}`}>
                  {formatMonto(c.saldo_actual)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}