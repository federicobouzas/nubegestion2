'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import Pagination from '@/components/shared/Pagination'
import { getOtrosIngresos, deleteOtroIngreso, formatMonto } from '@/lib/otros-ingresos'
import type { OtroIngreso } from '@/types/otros-ingresos'

export default function OtrosIngresosPage() {
  const [items, setItems] = useState<OtroIngreso[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(((await getOtrosIngresos()) as OtroIngreso[]) || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este ingreso? Se revertirá el saldo de la cuenta.')) return
    await deleteOtroIngreso(id)
    load()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Ingresos' }, { label: 'Otros Ingresos' }]}
        actions={
          <Link
            href="/otros-ingresos/nuevo"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            <Plus size={13} strokeWidth={2.2} /> Nuevo Ingreso
          </Link>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Otros Ingresos</h1>
        <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{items.length} registros</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
            No hay ingresos todavía.{' '}
            <Link href="/otros-ingresos/nuevo" className="text-[#F2682E] font-semibold hover:underline">
              Cargar el primero
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Código', 'Fecha', 'Tipo', 'Descripción', 'Cuenta', 'Importe', ''].map((h, i) => (
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
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{item.codigo || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">
                      {new Date(item.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{item.tipo}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.descripcion || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762]">{item.cuentas?.nombre || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">
                      {formatMonto(Number(item.importe))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/otros-ingresos/${item.id}/editar`}
                          className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
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
