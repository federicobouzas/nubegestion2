'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import { getCuentas } from '@/lib/cuentas'
import { TIPOS_INGRESO, formatMonto } from '@/lib/otros-ingresos'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import type { OtroIngresoForm } from '@/types/otros-ingresos'

interface Props {
  initialData?: Partial<OtroIngresoForm>
  onSubmit: (data: OtroIngresoForm) => Promise<void>
  submitLabel?: string
}

export default function OtroIngresoFormComp({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cuentas, setCuentas] = useState<{ id: string; nombre: string; saldo_actual: number | null }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<OtroIngresoForm>({
    fecha: initialData?.fecha || today,
    tipo: initialData?.tipo || '',
    descripcion: initialData?.descripcion ?? '',
    cuenta_id: initialData?.cuenta_id || '',
    importe: initialData?.importe ?? 0,
    notas: initialData?.notas ?? '',
  })

  useEffect(() => {
    getCuentas().then((d) => setCuentas(d || []))
  }, [])

  function setField(k: keyof OtroIngresoForm, v: string | number) {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((prev) => {
      const n = { ...prev }
      delete n[k as string]
      return n
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.fecha) newErrors['fecha'] = 'La fecha es obligatoria.'
    if (!form.tipo) newErrors['tipo'] = 'El tipo es obligatorio.'
    if (!form.cuenta_id) newErrors['cuenta_id'] = 'La cuenta es obligatoria.'
    if (!form.importe || Number(form.importe) <= 0) newErrors['importe'] = 'El importe debe ser mayor a 0.'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowModal(true)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Error.'
      setErrors({ _server: msg })
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
            <span className="font-display text-[13.5px] font-bold">Datos del ingreso</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <FieldWrapper label="Fecha" required error={errors.fecha}>
              <input
                className={inputCls(errors.fecha)}
                type="date"
                value={form.fecha}
                onChange={(e) => setField('fecha', e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Tipo" required error={errors.tipo}>
              <select
                className={inputCls(errors.tipo)}
                value={form.tipo}
                onChange={(e) => setField('tipo', e.target.value)}
              >
                <option value="">Seleccionar tipo...</option>
                {TIPOS_INGRESO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Cuenta" required error={errors.cuenta_id}>
              <select
                className={inputCls(errors.cuenta_id)}
                value={form.cuenta_id}
                onChange={(e) => setField('cuenta_id', e.target.value)}
              >
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({formatMonto(Number(c.saldo_actual ?? 0))})
                  </option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Importe" required error={errors.importe}>
              <input
                className={inputCls(errors.importe)}
                type="number"
                min={0}
                step={0.01}
                value={form.importe}
                onChange={(e) => setField('importe', parseFloat(e.target.value) || 0)}
              />
            </FieldWrapper>
            <div className="col-span-2">
              <FieldWrapper label="Descripción">
                <input
                  className={inputCls()}
                  value={form.descripcion}
                  onChange={(e) => setField('descripcion', e.target.value)}
                  placeholder="Descripción opcional..."
                />
              </FieldWrapper>
            </div>
            <div className="col-span-3">
              <FieldWrapper label="Notas">
                <textarea
                  className={inputCls()}
                  rows={2}
                  value={form.notas}
                  onChange={(e) => setField('notas', e.target.value)}
                  placeholder="Observaciones opcionales..."
                />
              </FieldWrapper>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push('/otros-ingresos')}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"
          >
            <X size={13} strokeWidth={2.2} /> Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
          >
            <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </>
  )
}
