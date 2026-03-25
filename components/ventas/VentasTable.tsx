'use client'
import Link from 'next/link'
import { Eye, Send, Printer } from 'lucide-react'
import { calcularEstado, formatMonto } from '@/lib/ventas'
import type { FacturaVenta } from '@/types/ventas'

interface Props {
  facturas: FacturaVenta[]
  onEnviarAFIP: (f: FacturaVenta) => void
}

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    cobrada: 'bg-[#E8F7EF] text-[#1A5C38]',
    pendiente: 'bg-[#FEF8E1] text-[#7A5500]',
    vencida: 'bg-[#FEE8E8] text-[#7F1D1D]',
  }
  const dot: Record<string, string> = {
    cobrada: 'bg-[#4EBB7F]', pendiente: 'bg-[#FDBC16]', vencida: 'bg-[#EE3232]',
  }
  const label: Record<string, string> = { cobrada: 'Cobrada', pendiente: 'Pendiente', vencida: 'Vencida' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[estado]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[estado]}`} />
      {label[estado]}
    </span>
  )
}

export default function VentasTable({ facturas, onEnviarAFIP }: Props) {
  if (facturas.length === 0) {
    return (
      <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
        No hay facturas todavía. <Link href="/ventas/nueva" className="text-[#F2682E] font-semibold hover:underline">Crear la primera</Link>
      </div>
    )
  }
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
            {['Código','Número','Tipo','Cliente','Fecha','Total','Saldo','Estado','CAE',''].map((h,i) => (
              <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {facturas.map(f => {
            const estado = calcularEstado(f.saldo_pendiente, f.fecha_vencimiento)
            const tieneCAE = !!f.cae
            return (
              <tr key={f.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{f.codigo}</td>
                <td className="px-4 py-3 font-mono text-[11.5px] font-bold text-[#18181B]">{f.numero || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] ${f.tipo === 'A' ? 'bg-[#DBEAFE] text-[#1E3A8A]' : f.tipo === 'B' ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F0EBFB] text-[#3D1F8A]'}`}>{f.tipo}</span>
                </td>
                <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{f.clientes?.nombre_razon_social || '—'}</td>
                <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762]">{new Date(f.fecha_emision).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(f.total)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{formatMonto(f.saldo_pendiente)}</td>
                <td className="px-4 py-3">{estadoBadge(estado)}</td>
                <td className="px-4 py-3">
                  {tieneCAE
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#E8F7EF] text-[#1A5C38] px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[#4EBB7F]" />CAE</span>
                    : <span className="text-[11px] text-[#A8A49D]">Sin CAE</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/ventas/${f.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors" title="Ver"><Eye size={13} strokeWidth={2} /></Link>
                    {!tieneCAE && (
                      <button onClick={() => onEnviarAFIP(f)} className="w-7 h-7 rounded-[6px] border border-[#A8DFF9] bg-[#E6F7FE] flex items-center justify-center text-[#1A9BD4] hover:bg-[#2CBAF2] hover:text-white transition-colors" title="Enviar a AFIP"><Send size={13} strokeWidth={2} /></button>
                    )}
                    <Link href={`/ventas/${f.id}?print=1`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors" title="Imprimir"><Printer size={13} strokeWidth={2} /></Link>
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
