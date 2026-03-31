'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import type { TallerForm as ITallerForm } from '@/types/produccion'

interface Props {
  initialData?: Partial<ITallerForm>
  onSubmit: (data: ITallerForm) => Promise<void>
  submitLabel?: string
}

export default function TallerForm({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ITallerForm>({
    nombre: initialData?.nombre ?? '',
  })

  function setField(k: keyof ITallerForm, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 max-w-xl">
        <FormErrorBanner show={Object.keys(errors).length > 0} />
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm">
          <FieldWrapper label="Nombre" required error={errors.nombre}>
            <input
              className={inputCls(errors.nombre)}
              value={form.nombre}
              onChange={e => setField('nombre', e.target.value)}
              placeholder="Nombre del taller"
              autoFocus
            />
          </FieldWrapper>
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
