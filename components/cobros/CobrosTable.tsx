'use client'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { formatMonto } from '@/lib/cobros'
import type { ReciboCobro } from '@/types/cobros'

export default function CobrosTable({ recibos }: { recibos: ReciboCobro[] }) {
  if (recibos.length === 0) {
    return (
      <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
        No hay recibos todavía.{' '}
        <Link href="/cobros/nueva" className="text-[#F2682E] font-semibold hover:underline">
          Crear el primero
        </Link>
      </div>
    )
  }
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
            {['Código', 'Número', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map((h, i) => (
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
          {recibos.map((r) => {
            const anulado = r.notas === '[ANULADO]'
            return (
              <tr
                key={r.id}
                className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group"
              >
                <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{r.codigo}</td>
                <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#18181B]">{r.numero || '—'}</td>
                <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">
                  {r.clientes?.nombre_razon_social || '—'}
                </td>
                <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">
                  {new Date(r.fecha).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(r.total)}</td>
                <td className="px-4 py-3">
                  {anulado ? (
                    <span className="text-[11px] font-bold bg-[#FEE8E8] text-[#7F1D1D] px-2 py-0.5 rounded-full">
                      Anulado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />
                      Cobrado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/cobros/${r.id}`}
                      className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
                    >
                      <Eye size={13} strokeWidth={2} />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
