'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import ListPageShell from '@/components/shared/ListPageShell'
import Badge from '@/components/shared/Badge'
import { getProductos, deleteProducto } from '@/lib/productos'
import type { Producto } from '@/types/productos'

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function ProductosPage() {
  const [rows, setRows] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const load = useCallback(async () => { setLoading(true); try { setRows((await getProductos(search || undefined)) || []) } finally { setLoading(false) } }, [search])
  useEffect(() => { load() }, [load])
  async function handleDelete(id: string) { if (!confirm('¿Eliminar este producto?')) return; await deleteProducto(id); setRows(p => p.filter(r => r.id !== id)) }
  return (
    <ListPageShell breadcrumb={[{ label: 'Negocio' }, { label: 'Productos' }]} title="Productos" count={rows.length} newHref="/productos/nuevo" newLabel="Nuevo Producto" search={search} onSearch={setSearch} loading={loading}>
      {rows.length === 0
        ? <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">No hay productos todavía.</div>
        : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Código','Nombre','Precio Venta','Precio Compra','IVA','Stock','Estado',''].map((h,i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{p.codigo || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-[12.5px] text-[#18181B]">{p.nombre}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#18181B] font-bold">{fmt(p.precio_venta)}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#6B6762]">{fmt(p.precio_compra)}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-[#3F3F46]">{p.iva}%</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[11.5px] font-bold ${p.stock_actual <= p.stock_minimo ? 'text-[#EE3232]' : 'text-[#18181B]'}`}>{p.stock_actual}</span>
                      {p.stock_actual <= p.stock_minimo && <span className="ml-1.5 text-[10px] bg-[#FEE8E8] text-[#7F1D1D] px-1.5 py-0.5 rounded-full font-semibold">bajo</span>}
                    </td>
                    <td className="px-4 py-3"><Badge variant={p.estado === 'activo' ? 'success' : 'gray'} label={p.estado === 'activo' ? 'Activo' : 'Inactivo'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/productos/${p.id}`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Eye size={13} strokeWidth={2} /></Link>
                        <Link href={`/productos/${p.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#FBCFBA] bg-[#FEF0EA] flex items-center justify-center text-[#F2682E] hover:bg-[#F2682E] hover:text-white transition-colors"><Pencil size={13} strokeWidth={2} /></Link>
                        <button onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-[6px] border border-[#FECACA] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"><Trash2 size={13} strokeWidth={2} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </ListPageShell>
  )
}
