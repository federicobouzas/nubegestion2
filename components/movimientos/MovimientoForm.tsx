'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import { getCuentas } from '@/lib/cuentas'
import { formatMonto } from '@/lib/movimientos'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import type { MovimientoCuentaForm } from '@/types/movimientos'

interface Props {
  initialData?: Partial<MovimientoCuentaForm>
  onSubmit: (data: MovimientoCuentaForm) => Promise<void>
  submitLabel?: string
}

export default function MovimientoForm({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<MovimientoCuentaForm>({
    cuenta_origen_id: initialData?.cuenta_origen_id || '',
    cuenta_destino_id: initialData?.cuenta_destino_id || '',
    fecha: initialData?.fecha || today,
    monto: initialData?.monto || 0,
    observacion: initialData?.observacion || '',
  })

  useEffect(() => {
    getCuentas({ activo: true }).then(d => setCuentas(d || []))
  }, [])

  function set(k: keyof MovimientoCuentaForm, v: any) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.cuenta_origen_id) newErrors['cuenta_origen_id'] = 'Seleccioná la cuenta origen.'
    if (!form.cuenta_destino_id) newErrors['cuenta_destino_id'] = 'Seleccioná la cuenta destino.'
    if (form.cuenta_origen_id && form.cuenta_origen_id === form.cuenta_destino_id) {
      newErrors['cuenta_destino_id'] = 'La cuenta destino debe ser distinta a la origen.'
    }
    if (!form.fecha) newErrors['fecha'] = 'La fecha es obligatoria.'
    if (!form.monto || Number(form.monto) <= 0) newErrors['monto'] = 'El monto debe ser mayor a 0.'

    // Validar saldo suficiente en cuenta origen
    const cuentaOrigen = cuentas.find(c => c.id === form.cuenta_origen_id)
    if (cuentaOrigen && Number(form.monto) > Number(cuentaOrigen.saldo_actual || 0)) {
      newErrors['monto'] = `Saldo insuficiente en ${cuentaOrigen.nombre} (disponible: ${formatMonto(cuentaOrigen.saldo_actual)}).`
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setShowModal(true); return }
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

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Datos del movimiento</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <FieldWrapper label="Cuenta Origen" required error={errors.cuenta_origen_id}>
              <select className={inputCls(errors.cuenta_origen_id)} value={form.cuenta_origen_id} onChange={e => set('cuenta_origen_id', e.target.value)}>
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({formatMonto(c.saldo_actual)})</option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Cuenta Destino" required error={errors.cuenta_destino_id}>
              <select className={inputCls(errors.cuenta_destino_id)} value={form.cuenta_destino_id} onChange={e => set('cuenta_destino_id', e.target.value)}>
                <option value="">Seleccionar cuenta...</option>
                {cuentas.filter(c => c.id !== form.cuenta_origen_id).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({formatMonto(c.saldo_actual)})</option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Fecha" required error={errors.fecha}>
              <input className={inputCls(errors.fecha)} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </FieldWrapper>
            <FieldWrapper label="Monto" required error={errors.monto}>
              <input className={inputCls(errors.monto)} type="number" min={0} step={0.01} value={form.monto} onChange={e => set('monto', parseFloat(e.target.value) || 0)} />
            </FieldWrapper>
          </div>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Observación</span>
          </div>
          <div className="p-4">
            <textarea className={inputCls()} rows={2} value={form.observacion} onChange={e => set('observacion', e.target.value)} placeholder="Observaciones opcionales..." />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => router.push('/tesoreria/movimientos')} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors">
            <X size={13} strokeWidth={2.2} /> Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50">
            <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </>
  )
}
