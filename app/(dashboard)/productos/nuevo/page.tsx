'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { createProducto } from '@/lib/productos'
import { getListasPrecios, upsertPreciosProducto } from '@/lib/listas-precios'
import type { ListaPrecio } from '@/types/listas-precios'

const inp = "bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-2 focus:ring-[#F2682E]/10 transition-colors placeholder:text-[#A8A49D] placeholder:font-normal w-full"
const inpSm = "bg-white border border-[#E5E4E0] rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-1 focus:ring-[#F2682E]/10 transition-colors w-full text-right font-mono"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">{label}{required && <span className="text-[#F2682E] ml-0.5">*</span>}</label>{children}</div>
}

export default function NuevoProductoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', precio_compra: 0, precio_venta: 0, iva: 21, unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 0, estado: 'activo' })
  const [listas, setListas] = useState<ListaPrecio[]>([])
  const [precios, setPrecios] = useState<Record<string, string>>({})

  useEffect(() => { getListasPrecios({estado:'activo'}).then(d => setListas(d || [])) }, [])

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }
  function setPrecio(listaId: string, valor: string) { setPrecios(p => ({ ...p, [listaId]: valor })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setLoading(true); setError(null)
    try {
      const producto = await createProducto(form)
      await upsertPreciosProducto(producto.id, listas.map(l => ({
        lista_precio_id: l.id,
        precio: precios[l.id] !== '' && precios[l.id] !== undefined ? parseFloat(precios[l.id].replace(',', '.')) : null,
      })))
      router.push('/productos')
    } catch (err: any) { setError(err.message || 'Error.'); setLoading(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Productos', href: '/productos' }, { label: 'Nuevo' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0"><h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Producto</h1></div>
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="bg-[#FEE8E8] border border-[#FECACA] text-[#7F1D1D] text-[13px] rounded-lg px-4 py-3">{error}</div>}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Datos del producto</span></div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Field label="Código"><input className={inp} value={form.codigo} onChange={e => set('codigo', e.target.value)} placeholder="SKU-001" /></Field>
              <Field label="Nombre" required><input className={inp} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del producto" /></Field>
              <div className="col-span-2"><Field label="Descripción"><textarea className={inp} rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional" /></Field></div>
              <Field label="Unidad de medida"><input className={inp} value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)} placeholder="unidad, kg, m..." /></Field>
              <Field label="IVA">
                <select className={inp} value={form.iva} onChange={e => set('iva', parseFloat(e.target.value))}>
                  {[0, 2.5, 5, 10.5, 21, 27].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </Field>
              <Field label="Precio de compra"><input className={inp} type="number" min={0} step={0.01} value={form.precio_compra} onChange={e => set('precio_compra', parseFloat(e.target.value) || 0)} /></Field>
              <Field label="Estado">
                <select className={inp} value={form.estado} onChange={e => set('estado', e.target.value)}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Stock</span></div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <Field label="Stock actual"><input className={inp} type="number" min={0} value={form.stock_actual} onChange={e => set('stock_actual', parseFloat(e.target.value) || 0)} /></Field>
              <Field label="Stock mínimo"><input className={inp} type="number" min={0} value={form.stock_minimo} onChange={e => set('stock_minimo', parseFloat(e.target.value) || 0)} /></Field>
            </div>
          </div>
          {listas.length > 0 && (
            <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Precios por lista</span></div>
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
                      <td className="px-4 py-2 w-44">
                        <input type="number" min={0} step={0.01} placeholder="—" value={precios[l.id] ?? ''} onChange={e => setPrecio(l.id, e.target.value)} className={inpSm} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
            <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : 'Guardar producto'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
