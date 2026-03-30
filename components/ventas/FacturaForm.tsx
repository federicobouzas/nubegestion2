'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { getClientes } from '@/lib/clientes'
import { getProductos } from '@/lib/productos'
import { getServicios } from '@/lib/servicios'
import { formatMonto } from '@/lib/ventas'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FieldWrapper, { inputCls, inputSmCls } from '@/components/shared/FieldWrapper'
import ProductoAutocomplete from '@/components/shared/ProductoAutocomplete'
import { pluralize } from '@/lib/utils'
import type { FacturaVentaForm, ItemFacturaVenta, PercepcionFactura } from '@/types/ventas'
import type { Cliente } from '@/types/clientes'
import type { Producto } from '@/types/productos'
import type { ItemCatalogo } from '@/types/servicios'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
        <span className="font-display text-[13.5px] font-bold">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const emptyItem = (): ItemFacturaVenta => ({ tipo_item: 'producto', producto_id: null, servicio_id: null, descripcion: '', cantidad: 1, precio_unitario: 0, iva_porcentaje: 21, descuento_porcentaje: 0, subtotal: 0 })
const emptyPerc = (): PercepcionFactura => ({ tipo: '', numero_comprobante: '', importe: 0 })
const tiposPercepcion = ['IIBB', 'Imp. Internos', 'Municipal', 'IVA Percepción', 'Sellos']

interface Props { onSubmit: (data: FacturaVentaForm) => Promise<void> }

export default function FacturaForm({ onSubmit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogoItems, setCatalogoItems] = useState<ItemCatalogo[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [itemLabels, setItemLabels] = useState<string[]>([''])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<FacturaVentaForm>({
    cliente_id: '', numero: '', tipo: 'B',
    fecha_emision: today, fecha_vencimiento: '', periodo_desde: '', periodo_hasta: '',
    condicion_venta: 'Contado', notas: '',
    items: [emptyItem()], percepciones: [],
  })

  useEffect(() => {
    getClientes({ estado: 'activo' }).then(d => setClientes(d || []))
    Promise.all([
      getProductos({ estado: 'activo' }),
      getServicios({ estado: 'activo' }),
    ]).then(([prods, servs]) => {
      setProductos(prods || [])
      const prodItems: ItemCatalogo[] = (prods || []).map(p => ({
        id: p.id,
        tipo: 'producto',
        nombre: p.nombre,
        codigo: p.codigo,
        iva: p.iva,
        precio_venta: p.precio_venta,
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
        unidad_medida: p.unidad_medida,
      }))
      const servItems: ItemCatalogo[] = (servs || []).map(s => ({
        id: s.id,
        tipo: 'servicio',
        nombre: s.nombre,
        iva: s.iva,
      }))
      setCatalogoItems([...prodItems, ...servItems])
    })
  }, [])

  function clearError(field: string) {
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  function setField(k: keyof FacturaVentaForm, v: any) {
    setForm(p => ({ ...p, [k]: v }))
    clearError(k as string)
  }

  function selectCliente(id: string) {
    const c = clientes.find(c => c.id === id)
    setClienteSeleccionado(c || null)
    setField('cliente_id', id)
    if (c) setField('tipo', c.tipo_factura)
  }

  function selectItem(idx: number, item: ItemCatalogo | null) {
    setForm(p => {
      const items = [...p.items]
      if (item) {
        items[idx] = {
          ...items[idx],
          tipo_item: item.tipo,
          producto_id: item.tipo === 'producto' ? item.id : null,
          servicio_id: item.tipo === 'servicio' ? item.id : null,
          descripcion: item.nombre,
          precio_unitario: item.precio_venta ?? items[idx].precio_unitario,
          iva_porcentaje: item.iva,
        }
      } else {
        items[idx] = { ...items[idx], tipo_item: 'producto', producto_id: null, servicio_id: null, descripcion: '' }
      }
      const i = items[idx]
      i.subtotal = i.cantidad * i.precio_unitario * (1 - i.descuento_porcentaje / 100)
      return { ...p, items }
    })
    setItemLabels(prev => { const next = [...prev]; next[idx] = item?.nombre || ''; return next })
    clearError(`item_${idx}_descripcion`)
    clearError(`item_${idx}_precio`)
  }

  function setItem(idx: number, k: keyof ItemFacturaVenta, v: any) {
    setForm(p => {
      const items = [...p.items]
      items[idx] = { ...items[idx], [k]: v }
      const i = items[idx]
      i.subtotal = Number(i.cantidad) * Number(i.precio_unitario) * (1 - Number(i.descuento_porcentaje) / 100)
      return { ...p, items }
    })
    clearError(`item_${idx}_${String(k)}`)
  }

  function addItem() {
    setForm(p => ({ ...p, items: [...p.items, emptyItem()] }))
    setItemLabels(p => [...p, ''])
  }
  function removeItem(idx: number) {
    setForm(p => ({ ...p, items: p.items.filter((_,i) => i !== idx) }))
    setItemLabels(p => p.filter((_,i) => i !== idx))
  }

  function addPerc() { setForm(p => ({ ...p, percepciones: [...p.percepciones, emptyPerc()] })) }
  function setPerc(idx: number, k: keyof PercepcionFactura, v: any) {
    setForm(p => { const percepciones = [...p.percepciones]; percepciones[idx] = { ...percepciones[idx], [k]: v }; return { ...p, percepciones } })
  }
  function removePerc(idx: number) { setForm(p => ({ ...p, percepciones: p.percepciones.filter((_,i) => i !== idx) })) }

  function getStockHint(item: ItemFacturaVenta) {
    if (item.tipo_item !== 'producto' || !item.producto_id) return null
    const prod = productos.find(p => p.id === item.producto_id)
    if (!prod) return null
    if (prod.stock_actual <= 0) return { text: 'Sin stock disponible', color: 'text-[#EE3232]' }
    const qty = pluralize(prod.stock_actual, prod.unidad_medida || 'unidad')
    if (prod.stock_actual <= (prod.stock_minimo || 0)) return { text: `Stock bajo mínimo — disponible: ${qty}`, color: 'text-[#B45309]' }
    return { text: `Disponible: ${qty}`, color: 'text-[#1A5C38]' }
  }

  const subtotal = form.items.reduce((a, i) => a + i.subtotal, 0)
  const impuestos = form.items.reduce((a, i) => a + i.subtotal * (i.iva_porcentaje / 100), 0)
  const percepciones = form.percepciones.reduce((a, p) => a + Number(p.importe), 0)
  const total = subtotal + impuestos + percepciones

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!form.cliente_id) newErrors['cliente_id'] = 'El cliente es obligatorio.'
    if (!form.fecha_emision) newErrors['fecha_emision'] = 'La fecha de emisión es obligatoria.'

    form.items.forEach((item, idx) => {
      const n = idx + 1
      if (!item.descripcion?.trim()) newErrors[`item_${idx}_descripcion`] = `Ítem ${n}: la descripción es obligatoria.`
      if (!item.cantidad || Number(item.cantidad) <= 0) newErrors[`item_${idx}_cantidad`] = `Ítem ${n}: la cantidad debe ser mayor a 0.`
      if (!item.precio_unitario || Number(item.precio_unitario) <= 0) newErrors[`item_${idx}_precio`] = `Ítem ${n}: el precio debe ser mayor a 0.`

      if (item.tipo_item === 'producto' && item.producto_id) {
        const prod = productos.find(p => p.id === item.producto_id)
        if (prod && Number(item.cantidad) > Number(prod.stock_actual)) {
          newErrors[`item_${idx}_cantidad`] = `Ítem ${n}: stock insuficiente — disponible: ${prod.stock_actual}`
        }
      }
    })

    form.percepciones.forEach((p, idx) => {
      if (p.importe > 0 || p.tipo) {
        const n = idx + 1
        if (!p.tipo) newErrors[`perc_${idx}_tipo`] = `Percepción ${n}: seleccioná un tipo.`
        if (!p.importe || Number(p.importe) <= 0) newErrors[`perc_${idx}_importe`] = `Percepción ${n}: el importe debe ser mayor a 0.`
      }
    })

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
      setErrors({ _server: err?.message || 'Error al guardar la factura.' })
      setShowModal(true)
    }
  }

  return (
    <>
      <FormErrorModal open={showModal} onClose={() => setShowModal(false)} errors={errors} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <Section title="Datos de la factura">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldWrapper label="Cliente" required error={errors.cliente_id}>
                <select className={inputCls(errors.cliente_id)} value={form.cliente_id} onChange={e => selectCliente(e.target.value)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_razon_social}</option>)}
                </select>
              </FieldWrapper>
              {clienteSeleccionado && (
                <div className="mt-1.5 flex gap-3 text-[11px] text-[#6B6762]">
                  <span>CUIT: <strong>{clienteSeleccionado.cuit || '—'}</strong></span>
                  <span>IVA: <strong>{clienteSeleccionado.condicion_iva}</strong></span>
                </div>
              )}
            </div>
            <FieldWrapper label="Tipo">
              <select className={inputCls()} value={form.tipo} onChange={e => setField('tipo', e.target.value)}>
                {['A','B','C','E','M'].map(t => <option key={t} value={t}>Factura {t}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Número (punto venta-nro)">
              <input className={inputCls()} value={form.numero} onChange={e => setField('numero', e.target.value)} placeholder="0001-00000001" />
            </FieldWrapper>
            <FieldWrapper label="Fecha de emisión" required error={errors.fecha_emision}>
              <input className={inputCls(errors.fecha_emision)} type="date" value={form.fecha_emision} onChange={e => setField('fecha_emision', e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="Fecha de vencimiento">
              <input className={inputCls()} type="date" value={form.fecha_vencimiento} onChange={e => setField('fecha_vencimiento', e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="Condición de venta">
              <select className={inputCls()} value={form.condicion_venta} onChange={e => setField('condicion_venta', e.target.value)}>
                {['Contado','Cuenta corriente','Tarjeta','Transferencia','Cheque'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Período desde">
              <input className={inputCls()} type="date" value={form.periodo_desde} onChange={e => setField('periodo_desde', e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="Período hasta">
              <input className={inputCls()} type="date" value={form.periodo_hasta} onChange={e => setField('periodo_hasta', e.target.value)} />
            </FieldWrapper>
          </div>
        </Section>

        {/* Items */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Ítems</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Producto / Servicio','Descripción','Cant.','Precio Unit.','IVA','Desc. %','Subtotal',''].map((h,i) => (
                    <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => {
                  const stockHint = getStockHint(item)
                  const selectedId = item.producto_id || item.servicio_id || ''
                  return (
                    <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                      <td className="px-3 py-2 min-w-[180px] align-top">
                        <ProductoAutocomplete
                          items={catalogoItems}
                          value={selectedId}
                          label={itemLabels[idx]}
                          error={errors[`item_${idx}_descripcion`]}
                          onSelect={p => selectItem(idx, p)}
                        />
                        {stockHint && <div className={`text-[10px] font-medium mt-1 ${stockHint.color}`}>{stockHint.text}</div>}
                      </td>
                      <td className="px-3 py-2 min-w-[180px] align-top">
                        <input className={inputSmCls(errors[`item_${idx}_descripcion`])} value={item.descripcion} onChange={e => setItem(idx, 'descripcion', e.target.value)} placeholder="Descripción" />
                        {errors[`item_${idx}_descripcion`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`item_${idx}_descripcion`]}</div>}
                      </td>
                      <td className="px-3 py-2 w-[100px] align-top">
                        <input className={inputSmCls(errors[`item_${idx}_cantidad`])} type="number" min={1} step={1} value={item.cantidad} onChange={e => setItem(idx, 'cantidad', parseInt(e.target.value) || 1)} />
                        {errors[`item_${idx}_cantidad`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`item_${idx}_cantidad`]}</div>}
                      </td>
                      <td className="px-3 py-2 w-[110px] align-top">
                        <input className={inputSmCls(errors[`item_${idx}_precio`])} type="number" min={0} step={0.01} value={item.precio_unitario} onChange={e => setItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)} />
                        {errors[`item_${idx}_precio`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`item_${idx}_precio`]}</div>}
                      </td>
                      <td className="px-3 py-2 w-[80px] align-top">
                        <select className={inputSmCls()} value={item.iva_porcentaje} onChange={e => setItem(idx, 'iva_porcentaje', parseFloat(e.target.value))}>
                          {[0,2.5,5,10.5,21,27].map(v => <option key={v} value={v}>{v}%</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 w-[80px] align-top">
                        <input className={inputSmCls()} type="number" min={0} max={100} step={0.01} value={item.descuento_porcentaje} onChange={e => setItem(idx, 'descuento_porcentaje', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-3 py-2 w-[110px] align-top">
                        <span className="font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(item.subtotal)}</span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors">
                            <Trash2 size={11} strokeWidth={2} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#F1F0EE]">
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors">
              <Plus size={13} strokeWidth={2.2} /> Agregar ítem
            </button>
          </div>
        </div>

        {/* Percepciones */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Percepciones y otros tributos</span>
          </div>
          {form.percepciones.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Tipo','N° Comprobante','Importe',''].map((h,i) => (
                    <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.percepciones.map((p, idx) => (
                  <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-3 py-2 min-w-[180px] align-top">
                      <select className={inputSmCls(errors[`perc_${idx}_tipo`])} value={p.tipo} onChange={e => setPerc(idx, 'tipo', e.target.value)}>
                        <option value="">Seleccionar tipo...</option>
                        {tiposPercepcion.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors[`perc_${idx}_tipo`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`perc_${idx}_tipo`]}</div>}
                    </td>
                    <td className="px-3 py-2 min-w-[140px] align-top">
                      <input className={inputSmCls()} value={p.numero_comprobante} onChange={e => setPerc(idx, 'numero_comprobante', e.target.value)} placeholder="Opcional" />
                    </td>
                    <td className="px-3 py-2 w-[120px] align-top">
                      <input className={inputSmCls(errors[`perc_${idx}_importe`])} type="number" min={0} step={0.01} value={p.importe} onChange={e => setPerc(idx, 'importe', parseFloat(e.target.value) || 0)} />
                      {errors[`perc_${idx}_importe`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`perc_${idx}_importe`]}</div>}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <button type="button" onClick={() => removePerc(idx)} className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors">
                        <Trash2 size={11} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3 border-t border-[#F1F0EE]">
            <button type="button" onClick={addPerc} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors">
              <Plus size={13} strokeWidth={2.2} /> Agregar percepción
            </button>
          </div>
        </div>

        {/* Totales */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Totales</span>
          </div>
          <div className="p-4 flex flex-col items-end gap-2">
            <div className="flex gap-8 text-[12.5px] text-[#6B6762]"><span>Subtotal neto</span><span className="font-mono font-bold text-[#18181B] w-32 text-right">{formatMonto(subtotal)}</span></div>
            {form.items.some(i => i.iva_porcentaje > 0) && <div className="flex gap-8 text-[12.5px] text-[#6B6762]"><span>IVA</span><span className="font-mono font-bold text-[#18181B] w-32 text-right">{formatMonto(impuestos)}</span></div>}
            {percepciones > 0 && <div className="flex gap-8 text-[12.5px] text-[#6B6762]"><span>Percepciones</span><span className="font-mono font-bold text-[#18181B] w-32 text-right">{formatMonto(percepciones)}</span></div>}
            <div className="flex gap-8 text-[14px] font-bold border-t border-[#E5E4E0] pt-2 mt-1"><span>Total</span><span className="font-mono text-[#F2682E] w-32 text-right text-[16px]">{formatMonto(total)}</span></div>
          </div>
        </div>

        <Section title="Notas">
          <textarea className={inputCls()} rows={2} value={form.notas} onChange={e => setField('notas', e.target.value)} placeholder="Observaciones opcionales..." />
        </Section>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : 'Guardar factura'}</button>
        </div>
      </form>
    </>
  )
}
