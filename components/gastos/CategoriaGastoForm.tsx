'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import { TIPOS_CATEGORIA } from '@/lib/gastos'
import type { CategoriaGastoForm } from '@/types/gastos'

interface Props {
  initialData?: Partial<CategoriaGastoForm>
  onSubmit: (data: CategoriaGastoForm) => Promise<void>
  submitLabel?: string
}

export default function CategoriaGastoFormComp({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CategoriaGastoForm>({
    tipo: initialData?.tipo || '',
    descripcion: initialData?.descripcion || '',
  })

  function set(k: keyof CategoriaGastoForm, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.tipo) newErrors['tipo'] = 'El tipo es obligatorio.'
    if (!form.descripcion.trim()) newErrors['descripcion'] = 'La descripción es obligatoria.'
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
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">Datos de la categoría</span></div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <FieldWrapper label="Tipo" required error={errors.tipo}>
              <select className={inputCls(errors.tipo)} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="">Seleccionar tipo...</option>
                {TIPOS_CATEGORIA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Descripción" required error={errors.descripcion}>
              <input className={inputCls(errors.descripcion)} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Ej: Sueldos, AFIP, Alquiler..." />
            </FieldWrapper>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => router.push('/categorias-gastos')} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}</button>
        </div>
      </form>
    </>
  )
}
