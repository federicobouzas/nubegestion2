'use client'
import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import { createClient } from '@/lib/supabase'
import { TENANT_ID } from '@/lib/constants'

const CONDICIONES_IVA = ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final']

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    razon_social: '',
    cuit: '',
    fecha_inicio_actividades: '',
    punto_venta: '1',
    domicilio_comercial: '',
    ingresos_brutos: '',
    condicion_iva: 'Responsable Inscripto',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('configuracion')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single()
      if (data) {
        setForm({
          razon_social: data.razon_social || '',
          cuit: data.cuit || '',
          fecha_inicio_actividades: data.fecha_inicio_actividades || '',
          punto_venta: String(data.punto_venta || '1'),
          domicilio_comercial: data.domicilio_comercial || '',
          ingresos_brutos: data.ingresos_brutos || '',
          condicion_iva: data.condicion_iva || 'Responsable Inscripto',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.razon_social.trim()) newErrors['razon_social'] = 'La razón social es obligatoria.'
    if (!form.cuit.trim()) newErrors['cuit'] = 'El CUIT es obligatorio.'
    if (!form.punto_venta || Number(form.punto_venta) < 1) newErrors['punto_venta'] = 'El punto de venta debe ser mayor a 0.'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setShowModal(true); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        tenant_id: TENANT_ID,
        razon_social: form.razon_social.trim(),
        cuit: form.cuit.trim(),
        fecha_inicio_actividades: form.fecha_inicio_actividades || null,
        punto_venta: Number(form.punto_venta),
        domicilio_comercial: form.domicilio_comercial.trim() || null,
        ingresos_brutos: form.ingresos_brutos.trim() || null,
        condicion_iva: form.condicion_iva,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('configuracion')
        .upsert(payload, { onConflict: 'tenant_id' })
      if (error) throw error
      setSaved(true)
    } catch (err: any) {
      setErrors({ _server: err?.message || 'Error al guardar.' })
      setShowModal(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Sistema' }, { label: 'Configuración' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <FormErrorModal open={showModal} onClose={() => setShowModal(false)} errors={errors} />
      <Topbar breadcrumb={[{ label: 'Sistema' }, { label: 'Configuración' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Configuración</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-none">
          <FormErrorBanner show={Object.keys(errors).length > 0} />

          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Datos de la Empresa</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <FieldWrapper label="Razón Social" required error={errors.razon_social}>
                <input className={inputCls(errors.razon_social)} value={form.razon_social} onChange={e => set('razon_social', e.target.value)} placeholder="Nombre o Razón Social" />
              </FieldWrapper>
              <FieldWrapper label="Domicilio Comercial">
                <input className={inputCls()} value={form.domicilio_comercial} onChange={e => set('domicilio_comercial', e.target.value)} placeholder="Calle, número, piso..." />
              </FieldWrapper>
              <FieldWrapper label="CUIT" required error={errors.cuit}>
                <input className={inputCls(errors.cuit)} value={form.cuit} onChange={e => set('cuit', e.target.value)} placeholder="20-12345678-9" />
              </FieldWrapper>
              <FieldWrapper label="Ingresos Brutos">
                <input className={inputCls()} value={form.ingresos_brutos} onChange={e => set('ingresos_brutos', e.target.value)} placeholder="Nro. IIBB" />
              </FieldWrapper>
              <FieldWrapper label="Fecha de Inicio de Actividades">
                <input className={inputCls()} type="date" value={form.fecha_inicio_actividades} onChange={e => set('fecha_inicio_actividades', e.target.value)} />
              </FieldWrapper>
              <FieldWrapper label="Condición frente al IVA">
                <select className={inputCls()} value={form.condicion_iva} onChange={e => set('condicion_iva', e.target.value)}>
                  {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Punto de Venta" required error={errors.punto_venta}>
                <input className={inputCls(errors.punto_venta)} type="number" min={1} max={9999} value={form.punto_venta} onChange={e => set('punto_venta', e.target.value)} placeholder="0001" />
              </FieldWrapper>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            {saved && <span className="text-[12px] font-semibold text-[#4EBB7F]">✓ Cambios guardados</span>}
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50">
              <Save size={13} strokeWidth={2.2} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}