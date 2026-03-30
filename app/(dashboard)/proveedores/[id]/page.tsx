'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import Badge from '@/components/shared/Badge'
import { getProveedor, deleteProveedor } from '@/lib/proveedores'
import type { Proveedor } from '@/types/proveedores'

export default function VerProveedorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [c, setC] = useState<Proveedor | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getProveedor(id).then(setC).catch(console.error).finally(() => setLoading(false)) }, [id])
  async function handleDelete() { if (!confirm('¿Eliminar?')) return; await deleteProveedor(id); router.push('/proveedores') }
  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!c) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Proveedores', href: '/proveedores' }, { label: c.nombre_razon_social }]} actions={
        <Link href={`/proveedores/${id}/editar`} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-white text-[#18181B] hover:border-[#A8A49D] transition-colors"><Pencil size={12} strokeWidth={2.2} /> Editar</Link>
      } />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <span className="font-display text-[13.5px] font-bold">{c.nombre_razon_social}</span>
            <Badge variant={c.estado === 'activo' ? 'success' : 'gray'}>{c.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[['CUIT', c.cuit || '—'],['Condición IVA', c.condicion_iva],['Tipo Factura', `Factura ${c.tipo_factura}`],['Localidad', c.localidad || '—'],['Provincia', c.provincia || '—'],['Teléfono', c.telefono || '—'],['Email', c.email || '—'],['Web', c.web || '—']].map(([l,v]) => (
              <div key={l} className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2.5">
                <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] mb-1">{l}</div>
                <div className="text-[13px] font-semibold text-[#18181B]">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors"><Trash2 size={13} strokeWidth={2} /> Eliminar proveedor</button>
        </div>
      </div>
    </div>
  )
}
