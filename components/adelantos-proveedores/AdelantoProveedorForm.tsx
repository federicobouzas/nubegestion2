'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import { getCuentas } from '@/lib/cuentas'
import { formatMonto } from '@/lib/adelantos-proveedores'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import type { AdelantoProveedorForm } from '@/types/adelantos-proveedores'

// Lazy import to avoid circular deps
async function loadProveedores() {
  const { getProveedores } = await import('@/lib/proveedores')
  return getProveedores()
}

interface Props {
  initialData?: Partial<AdelantoProveedorForm>
  onSubmit: (data: AdelantoProveedorForm) => Promise<void>
  submitLabel?: string
  readonly?: boolean
  importeOriginal?: number
  importeDisponible?: number
}

export default function AdelantoProveedorFormComp({
  initialData,
  onSubmit,
  submitLabel = 'Guardar',
  readonly = false,
  importeOriginal,
  importeDisponible,
}: Props) {
  const router = useRouter()
  const [loading, setLoading]       = useState(false)
  const [proveedores, setProveedores] = useState<{ id: string; nombre_razon_social: string }[]>([])
  const [cuentas, setCuentas]       = useState<{ id: string; nombre: string; saldo_actual: number | null }[]>([])
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [showModal, setShowModal]   = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<AdelantoProveedorForm>({
    proveedor_id: initialData?.proveedor_id ?? '',
    cuenta_id:    initialData?.cuenta_id    ?? '',
    fecha:        initialData?.fecha        ?? today,
    importe:      initialData?.importe      ?? 0,
  })

  useEffect(() => {
    loadProveedores().then(d => setProveedores(d || []))
    getCuentas({ estado: 'activo' }).then(d => setCuentas(d || []))
  }, [])

  function setField(k: keyof AdelantoProveedorForm, v: string | number) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k as string]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.proveedor_id) errs.proveedor_id = 'El proveedor es obligatorio.'
    if (!form.cuenta_id)    errs.cuenta_id    = 'La cuenta es obligatoria.'
    if (!form.fecha)        errs.fecha        = 'La fecha es obligatoria.'
    if (!form.importe || Number(form.importe) <= 0) errs.importe = 'El importe debe ser mayor a 0.'
    if (Object.keys(errs).length) { setErrors(errs); setShowModal(true); return }
    setErrors({})
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Error al guardar.'
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
            <span className="font-display text-[13.5px] font-bold">Datos del adelanto</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <FieldWrapper label="Proveedor" required error={errors.proveedor_id}>
              {readonly ? (
                <input
                  className={inputCls()}
                  value={proveedores.find(p => p.id === form.proveedor_id)?.nombre_razon_social ?? form.proveedor_id}
                  readOnly
                />
              ) : (
                <select
                  className={inputCls(errors.proveedor_id)}
                  value={form.proveedor_id}
                  onChange={e => setField('proveedor_id', e.target.value)}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre_razon_social}</option>
                  ))}
                </select>
              )}
            </FieldWrapper>

            <FieldWrapper label="Fecha" required error={errors.fecha}>
              <input
                className={inputCls(errors.fecha)}
                type="date"
                value={form.fecha}
                onChange={e => setField('fecha', e.target.value)}
                readOnly={readonly}
              />
            </FieldWrapper>

            <FieldWrapper label="Cuenta" required error={errors.cuenta_id}>
              {readonly ? (
                <input
                  className={inputCls()}
                  value={cuentas.find(c => c.id === form.cuenta_id)?.nombre ?? form.cuenta_id}
                  readOnly
                />
              ) : (
                <select
                  className={inputCls(errors.cuenta_id)}
                  value={form.cuenta_id}
                  onChange={e => setField('cuenta_id', e.target.value)}
                >
                  <option value="">Seleccionar cuenta...</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({formatMonto(Number(c.saldo_actual ?? 0))})
                    </option>
                  ))}
                </select>
              )}
            </FieldWrapper>

            <FieldWrapper label="Importe" required error={errors.importe}>
              <input
                className={inputCls(errors.importe)}
                type="number"
                min={0}
                step={0.01}
                value={form.importe}
                onChange={e => setField('importe', parseFloat(e.target.value) || 0)}
                readOnly={readonly}
              />
            </FieldWrapper>

            {readonly && importeOriginal !== undefined && (
              <FieldWrapper label="Importe original">
                <input className={inputCls()} value={formatMonto(importeOriginal)} readOnly />
              </FieldWrapper>
            )}

            {readonly && importeDisponible !== undefined && (
              <FieldWrapper label="Saldo disponible">
                <input className={inputCls()} value={formatMonto(importeDisponible)} readOnly />
              </FieldWrapper>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push('/adelantos-proveedores')}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"
          >
            <X size={13} strokeWidth={2.2} /> {readonly ? 'Volver' : 'Cancelar'}
          </button>
          {!readonly && (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
            >
              <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}
            </button>
          )}
        </div>
      </form>
    </>
  )
}
