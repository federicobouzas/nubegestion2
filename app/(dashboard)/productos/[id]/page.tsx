'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import Badge from '@/components/shared/Badge'
import { getProducto, deleteProducto } from '@/lib/productos'
import { getListasPrecios, getPreciosProducto } from '@/lib/listas-precios'
import type { Producto } from '@/types/productos'
import type { ListaPrecio } from '@/types/listas-precios'

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">{label}</label>
      <div className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] min-h-[38px] flex items-center">{children}</div>
    </div>
  )
}

export default function VerProductoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [p, setP] = useState<Producto | null>(null)
  const [listas, setListas] = useState<ListaPrecio[]>([])
  const [precios, setPrecios] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getProducto(id),
      getListasPrecios({ estado: 'activo' }),
      getPreciosProducto(id),
    ])
      .then(([producto, listasData, preciosData]) => {
        setP(producto)
        setListas(listasData || [])
        const map: Record<string, string> = {}
        for (const pr of (preciosData || [])) map[pr.lista_precio_id] = String(pr.precio)
        setPrecios(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('¿Eliminar?')) return
    await deleteProducto(id)
    router.push('/productos')
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!p) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Productos', href: '/productos' }, { label: p.nombre }]}
        actions={
          <Link href={`/productos/${id}/editar`} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] border border-[#E5E4E0] bg-white text-[#18181B] hover:border-[#A8A49D] transition-colors">
            <Pencil size={12} strokeWidth={2.2} /> Editar
          </Link>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">{p.nombre}</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">Datos del producto</span>
              <Badge variant={p.estado === 'activo' ? 'success' : 'gray'}>{p.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Field label="Código">{p.codigo || <span className="text-[#A8A49D]">—</span>}</Field>
              <Field label="Nombre">{p.nombre}</Field>
              <div className="col-span-2">
                <Field label="Descripción">{p.descripcion || <span className="text-[#A8A49D]">—</span>}</Field>
              </div>
              <Field label="Unidad de medida">{p.unidad_medida}</Field>
              <Field label="IVA">{p.iva}%</Field>
              <Field label="Precio de compra">{fmt(p.precio_compra)}</Field>
              <Field label="Estado">{p.estado}</Field>
            </div>
          </div>

          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Stock</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Field label="Stock actual">{p.stock_actual}</Field>
              <Field label="Stock mínimo">{p.stock_minimo}</Field>
            </div>
          </div>

          {listas.length > 0 && (
            <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
                <span className="font-display text-[13.5px] font-bold">Precios por lista</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4E0]">
                    <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">Lista</th>
                    <th className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-right font-medium w-44">Precio ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {listas.map(l => (
                    <tr key={l.id} className="border-b border-[#F1F0EE] last:border-0">
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-[#18181B]">{l.nombre}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-[12px] font-bold text-[#18181B] w-44">
                        {precios[l.id] ? fmt(parseFloat(precios[l.id])) : <span className="text-[#A8A49D] font-normal">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors">
              <Trash2 size={13} strokeWidth={2} /> Eliminar producto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
