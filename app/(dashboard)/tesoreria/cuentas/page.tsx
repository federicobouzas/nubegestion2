'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getCuentas, formatMonto, tipoCuentaLabel } from '@/lib/cuentas'
import type { Cuenta } from '@/types/cuentas'

function tipoBadge(tipo: string) {
  const map: Record<string, string> = {
    efectivo: 'bg-[#E8F7EF] text-[#1A5C38]',
    banco: 'bg-[#DBEAFE] text-[#1E3A8A]',
    a_cobrar: 'bg-[#FEF8E1] text-[#7A5500]',
    a_pagar: 'bg-[#FEE8E8] text-[#7F1D1D]',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[tipo] || 'bg-[#F1F0EE] text-[#6B6762]'}`}>
      {tipoCuentaLabel(tipo)}
    </span>
  )
}

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCuentas()
      .then((d) => setCuentas((d as Cuenta[]) || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Tesorería' }, { label: 'Cuentas' }]}
        actions={
          <Link
            href="/tesoreria/cuentas/nueva"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            <Plus size={13} strokeWidth={2.2} /> Nueva Cuenta
          </Link>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Cuentas</h1>
        <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{cuentas.length} cuentas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Nombre', 'Tipo', 'Saldo actual', 'Estado', ''].map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group"
                  >
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#18181B]">{c.nombre}</td>
                    <td className="px-4 py-3">{tipoBadge(c.tipo)}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">
                      {formatMonto(Number(c.saldo_actual ?? 0))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.activo ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F1F0EE] text-[#6B6762]'}`}
                      >
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/tesoreria/cuentas/${c.id}/editar`}
                          className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
