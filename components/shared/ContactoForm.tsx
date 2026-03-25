'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import FormErrorBanner from './FormErrorBanner'
import FormErrorModal from './FormErrorModal'
import FieldWrapper, { inputCls } from './FieldWrapper'
import { useFormValidation } from '@/hooks/useFormValidation'

type CondicionIVA = 'RI' | 'Mono' | 'Exento' | 'CF'
type TipoFactura = 'A' | 'B' | 'C' | 'E' | 'M'
const condicionToTipo: Record<CondicionIVA, TipoFactura> = { RI: 'A', Mono: 'C', Exento: 'B', CF: 'B' }

export interface ContactoFormData {
  nombre_razon_social: string; cuit: string; condicion_iva: CondicionIVA
  domicilio_fiscal: string; direccion: string; localidad: string; provincia: string
  codigo_postal: string; telefono: string; email: string; web: string
  tipo_factura: TipoFactura; estado: string
}

interface Props {
  initialData?: Partial<ContactoFormData>
  onSubmit: (data: ContactoFormData) => Promise<void>
  submitLabel?: string
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3"><span className="font-display text-[13.5px] font-bold">{title}</span></div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function ContactoForm({ initialData, onSubmit, submitLabel = 'Guardar' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { errors, showModal, setShowModal, validate, clearError } = useFormValidation()

  const [form, setForm] = useState<ContactoFormData>({
    nombre_razon_social: initialData?.nombre_razon_social || '',
    cuit: initialData?.cuit || '',
    condicion_iva: initialData?.condicion_iva || 'CF',
    domicilio_fiscal: initialData?.domicilio_fiscal || '',
    direccion: initialData?.direccion || '',
    localidad: initialData?.localidad || '',
    provincia: initialData?.provincia || '',
    codigo_postal: initialData?.codigo_postal || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    web: initialData?.web || '',
    tipo_factura: initialData?.tipo_factura || 'B',
    estado: initialData?.estado || 'activo',
  })

  function set(field: keyof ContactoFormData, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'condicion_iva') next.tipo_factura = condicionToTipo[value as CondicionIVA]
      return next
    })
    clearError(field)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = validate({
      nombre_razon_social: [{ value: form.nombre_razon_social, message: 'El nombre o razón social es obligatorio.' }],
    })
    if (!ok) return
    setLoading(true)
    try { await onSubmit(form) } catch { setLoading(false) }
  }

  return (
    <>
      <FormErrorModal open={showModal} onClose={() => setShowModal(false)} errors={errors} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto">
        <FormErrorBanner show={Object.keys(errors).length > 0} />
        <Section title="Datos principales">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FieldWrapper label="Nombre / Razón social" required error={errors.nombre_razon_social}>
                <input className={inputCls(errors.nombre_razon_social)} value={form.nombre_razon_social} onChange={e => set('nombre_razon_social', e.target.value)} placeholder="Ej: Juan Pérez o Empresa SA" />
              </FieldWrapper>
            </div>
            <FieldWrapper label="CUIT" error={errors.cuit}>
              <input className={inputCls(errors.cuit)} value={form.cuit} onChange={e => set('cuit', e.target.value)} placeholder="20-12345678-9" />
            </FieldWrapper>
            <FieldWrapper label="Condición IVA">
              <select className={inputCls()} value={form.condicion_iva} onChange={e => set('condicion_iva', e.target.value)}>
                <option value="RI">Resp. Inscripto</option>
                <option value="Mono">Monotributista</option>
                <option value="Exento">Exento</option>
                <option value="CF">Consumidor Final</option>
              </select>
            </FieldWrapper>
            <FieldWrapper label="Tipo de Factura">
              <select className={inputCls()} value={form.tipo_factura} onChange={e => set('tipo_factura', e.target.value)}>
                {(['A','B','C','E','M'] as TipoFactura[]).map(t => <option key={t} value={t}>Factura {t}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Estado">
              <select className={inputCls()} value={form.estado} onChange={e => set('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </FieldWrapper>
          </div>
        </Section>
        <Section title="Domicilio">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FieldWrapper label="Domicilio fiscal">
                <input className={inputCls()} value={form.domicilio_fiscal} onChange={e => set('domicilio_fiscal', e.target.value)} placeholder="Calle y número" />
              </FieldWrapper>
            </div>
            <FieldWrapper label="Localidad">
              <input className={inputCls()} value={form.localidad} onChange={e => set('localidad', e.target.value)} placeholder="Ciudad" />
            </FieldWrapper>
            <FieldWrapper label="Provincia">
              <input className={inputCls()} value={form.provincia} onChange={e => set('provincia', e.target.value)} placeholder="Provincia" />
            </FieldWrapper>
            <FieldWrapper label="Código Postal">
              <input className={inputCls()} value={form.codigo_postal} onChange={e => set('codigo_postal', e.target.value)} placeholder="1234" />
            </FieldWrapper>
          </div>
        </Section>
        <Section title="Contacto">
          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="Teléfono">
              <input className={inputCls()} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+54 11 1234-5678" />
            </FieldWrapper>
            <FieldWrapper label="Email" error={errors.email}>
              <input className={inputCls(errors.email)} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contacto@empresa.com" />
            </FieldWrapper>
            <FieldWrapper label="Sitio web">
              <input className={inputCls()} value={form.web} onChange={e => set('web', e.target.value)} placeholder="www.empresa.com" />
            </FieldWrapper>
          </div>
        </Section>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : submitLabel}</button>
        </div>
      </form>
    </>
  )
}
