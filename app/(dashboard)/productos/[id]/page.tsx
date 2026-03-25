'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import Badge from '@/components/shared/Badge'
import { getProducto, deleteProducto } from '@/lib/productos'
import type { Producto } from '@/types/productos'

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function VerProductoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [p, setP] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { getProducto(id).then(setP).catch(console.error).finally(() => setLoading(false)) }, [id])
  async function handleDelete() { if (!confirm('¿Eliminar?')) return; await deleteProducto(id); router.push('/productos') }
  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!p) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Productos', href: '/productos' }, { label: p.nombre }]} actions={
        <Link href={`/productos/${id}/editar`} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-white text-[#18181B] hover:border-[#A8A49D] transition-colors"><Pencil size={12} strokeWidth={2.2} /> Editar</Link>
      } />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <div><span className="font-display text-[13.5px] font-bold">{p.nombre}</span>{p.codigo && <span className="ml-2 font-mono text-[11px] text-[#A8A49D]">{p.codigo}</span>}</div>
            <Badge variant={p.estado === 'activo' ? 'success' : 'gray'} label={p.estado === 'activo' ? 'Activo' : 'Inactivo'} />
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[['Precio de venta', fmt(p.precio_venta)],['Precio de compra', fmt(p.precio_compra)],['IVA', `${p.iva}%`],['Unidad de medida', p.unidad_medida],['Stock actual', String(p.stock_actual)],['Stock mínimo', String(p.stock_minimo)]].map(([l,v]) => (
              <div key={l} className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2.5">
                <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] mb-1">{l}</div>
                <div className="text-[13px] font-semibold text-[#18181B]">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors"><Trash2 size={13} strokeWidth={2} /> Eliminar producto</button>
        </div>
      </div>
    </div>
  )
}
