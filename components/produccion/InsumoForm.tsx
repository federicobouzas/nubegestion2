'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import { getProveedores } from '@/lib/proveedores'
import type { InsumoForm as IInsumoForm } from '@/types/produccion'
import type { Proveedor } from '@/types/proveedores'

const UNIDADES = ['Unidad', 'Kg', 'g', 'L', 'ml', 'm', 'cm', 'Rollo', 'Caja']
const IVA_OPTS = [0, 10.5, 21]

interface Props {
  initialData?: Partial<IInsumoForm>
  onSubmit: (data: IInsumoForm) => Promise<void>
  submitLabel?: string
}

export default function InsumoForm({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  const [form, setForm] = useState<IInsumoForm>({
    nombre: initialData?.nombre ?? '',
    precio_compra: initialData?.precio_compra ?? 0,
    unidad_medida: initialData?.unidad_medida ?? 'Unidad',
    proveedor_id: initialData?.proveedor_id ?? '',
    iva: initialData?.iva ?? 0,
    estado: initialData?.estado ?? 'activo',
    observaciones: initialData?.observaciones ?? '',
  })

  useEffect(() => {
    getProveedores().then(d => setProveedores(d || []))
  }, [])

  function setField(k: keyof IInsumoForm, v: any) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.'
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

        <div className="bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldWrapper label="Nombre" required error={errors.nombre}>
                <input
                  className={inputCls(errors.nombre)}
                  value={form.nombre}
                  onChange={e => setField('nombre', e.target.value)}
                  placeholder="Nombre del insumo"
                  autoFocus
                />
              </FieldWrapper>
            </div>

            <FieldWrapper label="Unidad de Medida">
              <select className={inputCls()} value={form.unidad_medida} onChange={e => setField('unidad_medida', e.target.value)}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Proveedor">
              <select className={inputCls()} value={form.proveedor_id} onChange={e => setField('proveedor_id', e.target.value)}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_razon_social}</option>)}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Precio de Compra">
              <input
                className={inputCls()}
                type="number"
                min={0}
                step={0.01}
                value={form.precio_compra}
                onChange={e => setField('precio_compra', parseFloat(e.target.value) || 0)}
              />
            </FieldWrapper>

            <FieldWrapper label="IVA">
              <select className={inputCls()} value={form.iva} onChange={e => setField('iva', parseFloat(e.target.value))}>
                {IVA_OPTS.map(v => <option key={v} value={v}>{v}%</option>)}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Estado">
              <select className={inputCls()} value={form.estado} onChange={e => setField('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FieldWrapper>

            <div className="col-span-2">
              <FieldWrapper label="Observaciones">
                <textarea
                  className={inputCls()}
                  rows={2}
                  value={form.observaciones}
                  onChange={e => setField('observaciones', e.target.value)}
                  placeholder="Observaciones opcionales..."
                />
              </FieldWrapper>
            </div>
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
            <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </>
  )
}
