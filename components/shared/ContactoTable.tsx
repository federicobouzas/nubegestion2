'use client'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import Badge from './Badge'

interface Row { id: string; nombre_razon_social: string; cuit: string | null; condicion_iva: string; tipo_factura: string; email: string | null; telefono: string | null; estado: string }
interface Props { rows: Row[]; basePath: string; emptyMessage: string; onDelete: (id: string) => void }

export default function ContactoTable({ rows, basePath, emptyMessage, onDelete }: Props) {
  if (rows.length === 0) return <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">{emptyMessage}</div>
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
            {['Nombre / Razón social','CUIT','Condición IVA','Tipo Factura','Contacto','Estado',''].map((h,i) => (
              <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
              <td className="px-4 py-3 font-semibold text-[12.5px] text-[#18181B]">{row.nombre_razon_social}</td>
              <td className="px-4 py-3 font-mono text-[11.5px] text-[#3F3F46]">{row.cuit || '—'}</td>
              <td className="px-4 py-3 text-[12.5px] text-[#3F3F46]">{row.condicion_iva}</td>
              <td className="px-4 py-3">
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] ${row.tipo_factura === 'A' ? 'bg-[#DBEAFE] text-[#1E3A8A]' : row.tipo_factura === 'B' ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F0EBFB] text-[#3D1F8A]'}`}>{row.tipo_factura}</span>
              </td>
              <td className="px-4 py-3 text-[12px] text-[#6B6762]">{row.email || row.telefono || '—'}</td>
              <td className="px-4 py-3"><Badge variant={row.estado === 'activo' ? 'success' : 'gray'}>{row.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`${basePath}/${row.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Eye size={13} strokeWidth={2} /></Link>
                  <Link href={`${basePath}/${row.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#FBCFBA] bg-[#FEF0EA] flex items-center justify-center text-[#F2682E] hover:bg-[#F2682E] hover:text-white transition-colors"><Pencil size={13} strokeWidth={2} /></Link>
                  <button onClick={() => onDelete(row.id)} className="w-7 h-7 rounded-[6px] border border-[#FECACA] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"><Trash2 size={13} strokeWidth={2} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
