'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { getCategoriasGasto, getCuentas, formatMonto } from '@/lib/gastos'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FieldWrapper, { inputCls, inputSmCls } from '@/components/shared/FieldWrapper'
import type { GastoForm, GastoMetodo } from '@/types/gastos'
import type { CategoriaGasto } from '@/types/gastos'

interface Props {
  initialData?: Partial<GastoForm>
  onSubmit: (data: GastoForm) => Promise<void>
  submitLabel?: string
}

export default function GastoFormComp({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  const [cuentas, setCuentas] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<GastoForm>({
    categoria_id: initialData?.categoria_id || '',
    descripcion: initialData?.descripcion || '',
    numero_factura: initialData?.numero_factura || '',
    fecha_pago: initialData?.fecha_pago || today,
    notas: initialData?.notas || '',
    metodos: initialData?.metodos || [],
  })

  useEffect(() => {
    getCategoriasGasto().then(d => setCategorias(d || []))
    getCuentas().then(d => setCuentas(d || []))
  }, [])

  function set(k: keyof GastoForm, v: any) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  function addMetodo() { setForm(p => ({ ...p, metodos: [...p.metodos, { cuenta_id: '', monto: 0 }] })) }
  function setMetodo(idx: number, k: keyof GastoMetodo, v: any) {
    setForm(p => { const metodos = [...p.metodos]; metodos[idx] = { ...metodos[idx], [k]: v }; return { ...p, metodos } })
  }
  function removeMetodo(idx: number) { setForm(p => ({ ...p, metodos: p.metodos.filter((_,i) => i !== idx) })) }

  const total = form.metodos.reduce((a, m) => a + Number(m.monto), 0)

  // Agrupar categorías por tipo para el selector
  const categoriasAgrupadas = categorias.reduce((acc, c) => {
    if (!acc[c.tipo]) acc[c.tipo] = []
    acc[c.tipo].push(c)
    return acc
  }, {} as Record<string, CategoriaGasto[]>)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.categoria_id) newErrors['categoria_id'] = 'La categoría es obligatoria.'
    if (!form.fecha_pago) newErrors['fecha_pago'] = 'La fecha de pago es obligatoria.'
    if (form.metodos.length === 0) newErrors['metodos'] = 'Agregá al menos un método de pago.'
    if (!form.descripcion.trim()) newErrors['descripcion'] = 'La descripción es obligatoria.'
    if (!form.fecha_pago) newErrors['fecha_pago'] = 'La fecha de pago es obligatoria.'
    if (!form.categoria_id) newErrors['categoria_id'] = 'La categoría es obligatoria.'

    form.metodos.forEach((m, idx) => {
      if (!m.cuenta_id) newErrors[`metodo_${idx}_cuenta`] = `Método ${idx+1}: seleccioná una cuenta.`
      if (!m.monto || Number(m.monto) <= 0) newErrors[`metodo_${idx}_monto`] = `Método ${idx+1}: el monto debe ser mayor a 0.`
      const cuenta = cuentas.find(c => c.id === m.cuenta_id)
      if (cuenta && Number(m.monto) > Number(cuenta.saldo_actual || 0)) {
        newErrors[`metodo_${idx}_monto`] = `Método ${idx+1}: saldo insuficiente en ${cuenta.nombre} (disponible: ${formatMonto(cuenta.saldo_actual)}).`
      }
    })

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setShowModal(true); return }
    setErrors({})
    setLoading(true)
    try { await onSubmit(form) } catch (err: any) { setLoading(false); setErrors({ _server: err?.message || 'Error.' }); setShowModal(true) }
  }

  return (
    <>
      <FormErrorModal open={showModal} onClose={() => setShowModal(false)} errors={errors} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Datos del gasto</span></div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldWrapper label="Categoría" required error={errors.categoria_id}>
                <select className={inputCls(errors.categoria_id)} value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
                  <option value="">Seleccionar categoría...</option>
                  {Object.entries(categoriasAgrupadas).map(([tipo, cats]) => (
                    <optgroup key={tipo} label={tipo}>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                    </optgroup>
                  ))}
                </select>
              </FieldWrapper>
            </div>
            <FieldWrapper label="Fecha de pago" required error={errors.fecha_pago}>
              <input className={inputCls(errors.fecha_pago)} type="date" value={form.fecha_pago} onChange={e => set('fecha_pago', e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="Descripción" required error={errors.descripcion}>
              <input className={inputCls()} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional..." />
            </FieldWrapper>
            <FieldWrapper label="Nro. de factura">
              <input className={inputCls()} value={form.numero_factura} onChange={e => set('numero_factura', e.target.value)} placeholder="Opcional" />
            </FieldWrapper>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <span className="font-display text-[13.5px] font-bold">Métodos de pago</span>
            <button type="button" onClick={addMetodo} className="flex items-center gap-1 text-[11.5px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors">
              <Plus size={12} strokeWidth={2.2} /> Agregar
            </button>
          </div>
          {errors.metodos && <div className="px-4 py-2 text-[12px] text-[#EE3232]">{errors.metodos}</div>}
          {form.metodos.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">Agregá un método de pago.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Cuenta','Monto',''].map((h,i) => (
                    <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.metodos.map((m, idx) => (
                  <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-4 py-2.5 min-w-[260px] align-top">
                      <select className={inputSmCls(errors[`metodo_${idx}_cuenta`])} value={m.cuenta_id} onChange={e => setMetodo(idx, 'cuenta_id', e.target.value)}>
                        <option value="">Seleccionar cuenta...</option>
                        {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({formatMonto(c.saldo_actual)})</option>)}
                      </select>
                      {errors[`metodo_${idx}_cuenta`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`metodo_${idx}_cuenta`]}</div>}
                    </td>
                    <td className="px-4 py-2.5 w-[160px] align-top">
                      <input className={inputSmCls(errors[`metodo_${idx}_monto`])} type="number" min={0} step={0.01} value={m.monto} onChange={e => setMetodo(idx, 'monto', parseFloat(e.target.value) || 0)} />
                      {errors[`metodo_${idx}_monto`] && <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`metodo_${idx}_monto`]}</div>}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <button type="button" onClick={() => removeMetodo(idx)} className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors">
                        <Trash2 size={11} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {total > 0 && (
            <div className="border-t border-[#E5E4E0] px-4 py-3 flex justify-end">
              <div className="flex gap-8 text-[13px] font-bold">
                <span>Total</span>
                <span className="font-mono text-[#F2682E] w-32 text-right">{formatMonto(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Notas</span></div>
          <div className="p-4">
            <textarea className={inputCls()} rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones opcionales..." />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => router.push('/gastos')} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}</button>
        </div>
      </form>
    </>
  )
}
