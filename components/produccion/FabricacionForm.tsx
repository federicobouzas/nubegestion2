'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X } from 'lucide-react'
import FieldWrapper, { inputCls, inputSmCls } from '@/components/shared/FieldWrapper'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import ProductoAutocomplete from '@/components/shared/ProductoAutocomplete'
import { getTalleres, getCostoInsumosProducto, checkStockFabricacion } from '@/lib/produccion'
import { getProductos } from '@/lib/productos'
import { formatMonto } from '@/lib/gastos'
import type { FabricacionForm as IFabricacionForm, FabricacionProductoForm } from '@/types/produccion'
import type { Taller } from '@/types/produccion'
import type { ItemCatalogo } from '@/types/servicios'

interface Props {
  onSubmit: (data: IFabricacionForm) => Promise<void>
}

const emptyProducto = (): FabricacionProductoForm => ({
  producto_id: '',
  cantidad: 1,
  costo_insumos: 0,
  costo_fabricacion: 0,
  costo_total: 0,
  observaciones: '',
})

function calcTotal(row: FabricacionProductoForm): number {
  return (Number(row.costo_insumos) + Number(row.costo_fabricacion)) * Number(row.cantidad)
}

export default function FabricacionForm({ onSubmit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([])
  const [productoLabels, setProductoLabels] = useState<string[]>([''])

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<IFabricacionForm>({
    fecha_fabricacion: today,
    fecha_estimada_finalizacion: '',
    taller_id: '',
    estado: 'en_proceso',
    productos: [emptyProducto()],
  })

  useEffect(() => {
    getTalleres().then(d => setTalleres(d || []))
    getProductos({ estado: 'activo' }).then((d: any[]) => {
      setCatalogo((d || []).map(p => ({
        id: p.id,
        tipo: 'producto' as const,
        nombre: p.nombre,
        codigo: p.codigo ?? null,
        iva: p.iva ?? 0,
        stock_actual: p.stock_actual ?? 0,
        stock_minimo: p.stock_minimo ?? 0,
        unidad_medida: p.unidad_medida ?? '',
      })))
    })
  }, [])

  function setField(k: keyof Omit<IFabricacionForm, 'productos'>, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  async function selectProducto(idx: number, item: ItemCatalogo | null) {
    const producto_id = item?.id ?? ''
    setProductoLabels(prev => { const n = [...prev]; n[idx] = item?.nombre ?? ''; return n })
    setForm(p => {
      const prods = [...p.productos]
      prods[idx] = { ...prods[idx], producto_id, costo_insumos: 0, costo_total: 0 }
      return { ...p, productos: prods }
    })
    setErrors(prev => { const n = { ...prev }; delete n[`prod_${idx}_producto_id`]; return n })
    if (!producto_id) return
    try {
      const costo = await getCostoInsumosProducto(producto_id)
      setForm(p => {
        const prods = [...p.productos]
        prods[idx] = {
          ...prods[idx],
          costo_insumos: costo,
          costo_total: calcTotal({ ...prods[idx], costo_insumos: costo }),
        }
        return { ...p, productos: prods }
      })
    } catch { /* sin receta, costo 0 */ }
  }

  function setProductoField(idx: number, k: keyof FabricacionProductoForm, v: any) {
    setForm(p => {
      const prods = [...p.productos]
      prods[idx] = { ...prods[idx], [k]: v }
      prods[idx].costo_total = calcTotal(prods[idx])
      return { ...p, productos: prods }
    })
    setErrors(prev => { const n = { ...prev }; delete n[`prod_${idx}_${String(k)}`]; return n })
  }

  function addProducto() {
    setForm(p => ({ ...p, productos: [...p.productos, emptyProducto()] }))
    setProductoLabels(p => [...p, ''])
  }

  function removeProducto(idx: number) {
    setForm(p => ({ ...p, productos: p.productos.filter((_, i) => i !== idx) }))
    setProductoLabels(p => p.filter((_, i) => i !== idx))
  }

  const costoTotalGeneral = form.productos.reduce((a, p) => a + p.costo_total, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.fecha_fabricacion) newErrors.fecha_fabricacion = 'La fecha es obligatoria.'
    if (!form.taller_id) newErrors.taller_id = 'El taller es obligatorio.'
    if (form.productos.length === 0) newErrors._productos = 'Agregá al menos un producto.'

    form.productos.forEach((p, idx) => {
      if (!p.producto_id) newErrors[`prod_${idx}_producto_id`] = `Producto ${idx + 1}: seleccioná un producto.`
      if (!p.cantidad || Number(p.cantidad) <= 0) newErrors[`prod_${idx}_cantidad`] = `Producto ${idx + 1}: la cantidad debe ser mayor a 0.`
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowModal(true)
      return
    }

    // Validar stock
    for (let i = 0; i < form.productos.length; i++) {
      const p = form.productos[i]
      try {
        const result = await checkStockFabricacion(p.producto_id, p.cantidad)
        if (result.status === 'ERROR') {
          const prod = catalogo.find(pr => pr.id === p.producto_id)
          newErrors[`prod_${i}_cantidad`] =
            `${prod?.nombre || 'Producto'}: stock insuficiente. Máximo posible: ${result.maximo} unidades.`
        }
      } catch { /* si no hay receta, OK */ }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowModal(true)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setLoading(false)
      setErrors({ _server: err?.message || 'Error al guardar.' })
      setShowModal(true)
    }
  }

  return (
    <>
      <FormErrorModal open={showModal} onClose={() => setShowModal(false)} errors={errors} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        {/* Datos generales */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Datos de la fabricación</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <FieldWrapper label="Fecha de fabricación" required error={errors.fecha_fabricacion}>
              <input
                className={inputCls(errors.fecha_fabricacion)}
                type="date"
                value={form.fecha_fabricacion}
                onChange={e => setField('fecha_fabricacion', e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Fecha estimada finalización">
              <input
                className={inputCls()}
                type="date"
                value={form.fecha_estimada_finalizacion}
                onChange={e => setField('fecha_estimada_finalizacion', e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Taller" required error={errors.taller_id}>
              <select
                className={inputCls(errors.taller_id)}
                value={form.taller_id}
                onChange={e => setField('taller_id', e.target.value)}
              >
                <option value="">Seleccionar taller...</option>
                {talleres.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </FieldWrapper>
          </div>
        </div>

        {/* Productos en producción */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Productos en Producción</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Producto', 'Cantidad', 'Costo Insumos/u', 'Costo Fabricación/u', 'Costo Total', 'Observaciones', ''].map((h, i) => (
                    <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.productos.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-3 py-2 min-w-[220px] align-top">
                      <ProductoAutocomplete
                        items={catalogo}
                        value={row.producto_id}
                        label={productoLabels[idx]}
                        error={errors[`prod_${idx}_producto_id`]}
                        onSelect={item => selectProducto(idx, item)}
                        placeholder="Buscar producto..."
                      />
                      {errors[`prod_${idx}_producto_id`] && (
                        <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`prod_${idx}_producto_id`]}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 w-[90px] align-top">
                      <input
                        className={inputSmCls(errors[`prod_${idx}_cantidad`])}
                        type="number"
                        min={1}
                        step={1}
                        value={row.cantidad}
                        onChange={e => setProductoField(idx, 'cantidad', parseInt(e.target.value) || 1)}
                      />
                      {errors[`prod_${idx}_cantidad`] && (
                        <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`prod_${idx}_cantidad`]}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 w-[120px] align-top">
                      <span className="font-mono text-[12px] text-[#6B6762] block pt-1.5">
                        {formatMonto(row.costo_insumos)}
                      </span>
                    </td>
                    <td className="px-3 py-2 w-[130px] align-top">
                      <input
                        className={inputSmCls()}
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.costo_fabricacion}
                        onChange={e => setProductoField(idx, 'costo_fabricacion', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2 w-[120px] align-top">
                      <span className="font-mono text-[12px] font-bold text-[#18181B] block pt-1.5">
                        {formatMonto(row.costo_total)}
                      </span>
                    </td>
                    <td className="px-3 py-2 min-w-[150px] align-top">
                      <input
                        className={inputSmCls()}
                        value={row.observaciones}
                        onChange={e => setProductoField(idx, 'observaciones', e.target.value)}
                        placeholder="Opcional"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      {form.productos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProducto(idx)}
                          className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"
                        >
                          <Trash2 size={11} strokeWidth={2} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#F1F0EE]">
            <button
              type="button"
              onClick={addProducto}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors"
            >
              <Plus size={13} strokeWidth={2.2} /> Agregar producto
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-4 shadow-sm flex justify-end">
          <div className="flex gap-8 text-[14px] font-bold">
            <span className="text-[#6B6762]">Costo Total</span>
            <span className="font-mono text-[#F2682E] text-[16px]">{formatMonto(costoTotalGeneral)}</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"
          >
            <X size={13} strokeWidth={2.2} /> Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
          >
            <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : 'Guardar fabricación'}
          </button>
        </div>
      </form>
    </>
  )
}
