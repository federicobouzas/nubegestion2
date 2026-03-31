'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getFabricaciones } from '@/lib/produccion'
import { formatMonto } from '@/lib/gastos'
import type { Fabricacion } from '@/types/produccion'

function EstadoBadge({ estado }: { estado: string }) {
  const cfg =
    estado === 'finalizado'
      ? { bg: 'bg-[#E8F7EF]', text: 'text-[#1A5C38]', dot: 'bg-[#4EBB7F]', label: 'Finalizado' }
      : { bg: 'bg-[#FEF9EC]', text: 'text-[#92400E]', dot: 'bg-[#F59E0B]', label: 'En proceso' }
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function diasDesvio(estimada: string | null, finalizada: string | null): React.ReactNode {
  if (!estimada || !finalizada) return '—'
  const diff = Math.round(
    (new Date(finalizada).getTime() - new Date(estimada).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff === 0) return <span className="font-mono text-[11px] text-[#1A5C38]">0</span>
  if (diff > 0) return <span className="font-mono text-[11px] text-[#EE3232] font-bold">+{diff}</span>
  return <span className="font-mono text-[11px] text-[#1A5C38]">{diff}</span>
}

export default function FabricacionPage() {
  const [data, setData] = useState<Fabricacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFabricaciones().then(d => setData(d as Fabricacion[])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Producción' }, { label: 'Fabricación' }]}
        actions={
          <Link
            href="/fabricacion/nueva"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            <Plus size={13} strokeWidth={2.2} /> Nueva Fabricación
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {['Código', 'Taller', 'Fecha Fab.', 'Fecha Est. Fin.', 'Fecha Fin.', 'Desvío', 'Productos', 'Costo Total', 'Estado', ''].map((h, i) => (
                  <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-[12px] text-[#A8A49D]">No hay fabricaciones.</td></tr>
              ) : data.map((fab: any) => (
                <tr key={fab.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] group transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{fab.codigo}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B6762]">{fab.talleres?.nombre || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">
                    {new Date(fab.fecha_fabricacion).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">
                    {fab.fecha_estimada_finalizacion ? new Date(fab.fecha_estimada_finalizacion).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">
                    {fab.fecha_finalizacion ? new Date(fab.fecha_finalizacion).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-4 py-3">{diasDesvio(fab.fecha_estimada_finalizacion, fab.fecha_finalizacion)}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{fab.cantidad_productos ?? 0}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(fab.costo_total ?? 0)}</td>
                  <td className="px-4 py-3"><EstadoBadge estado={fab.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <Link href={`/fabricacion/${fab.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                        <Eye size={13} strokeWidth={2} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
