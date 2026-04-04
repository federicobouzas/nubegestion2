'use client'
import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'

const CONDICIONES_IVA = ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final']

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const [userForm, setUserForm] = useState({
    nombre: '',
    email: '',
    password: '',
    password2: '',
  })

  const [tenantForm, setTenantForm] = useState({
    razon_social: '',
    cuit: '',
    fecha_inicio_actividades: '',
    punto_venta: '1',
    domicilio_fiscal: '',
    ingresos_brutos: '',
    condicion_iva: 'Responsable Inscripto',
    telefono: '',
    email: '',
    localidad: '',
    provincia: '',
    codigo_postal: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const TENANT_ID = await getTenantId()

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: u } = await supabase
          .from('usuarios')
          .select('nombre, email')
          .eq('id', user.id)
          .single()
        if (u) setUserForm(p => ({ ...p, nombre: u.nombre || '', email: u.email || '' }))
      }

      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', TENANT_ID)
        .single()
      if (t) {
        setTenantForm({
          razon_social: t.razon_social || '',
          cuit: t.cuit || '',
          fecha_inicio_actividades: t.fecha_inicio_actividades || '',
          punto_venta: String(t.punto_venta || '1'),
          domicilio_fiscal: t.domicilio_fiscal || '',
          ingresos_brutos: t.ingresos_brutos || '',
          condicion_iva: t.condicion_iva || 'Responsable Inscripto',
          telefono: t.telefono || '',
          email: t.email || '',
          localidad: t.localidad || '',
          provincia: t.provincia || '',
          codigo_postal: t.codigo_postal || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function setU(k: string, v: string) {
    setUserForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
    setSaved(false)
  }

  function setT(k: string, v: string) {
    setTenantForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!userForm.nombre.trim()) newErrors['nombre'] = 'El nombre es obligatorio.'
    if (!userForm.email.trim()) newErrors['email'] = 'El email es obligatorio.'
    if (userForm.password && userForm.password !== userForm.password2)
      newErrors['password2'] = 'Las contraseñas no coinciden.'
    if (!tenantForm.razon_social.trim()) newErrors['razon_social'] = 'La razón social es obligatoria.'
    if (!tenantForm.cuit.trim()) newErrors['cuit'] = 'El CUIT es obligatorio.'
    if (!tenantForm.punto_venta || Number(tenantForm.punto_venta) < 1)
      newErrors['punto_venta'] = 'El punto de venta debe ser mayor a 0.'

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setShowModal(true); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const TENANT_ID = await getTenantId()
      const { data: { user } } = await supabase.auth.getUser()

      // Guardar usuario
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ nombre: userForm.nombre.trim(), email: userForm.email.trim() })
        .eq('id', user!.id)
      if (userError) throw userError

      // Cambiar contraseña si se completó
      if (userForm.password) {
        const { error: passError } = await supabase.auth.updateUser({ password: userForm.password })
        if (passError) throw passError
      }

      // Guardar tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          razon_social: tenantForm.razon_social.trim(),
          cuit: tenantForm.cuit.trim(),
          fecha_inicio_actividades: tenantForm.fecha_inicio_actividades || null,
          punto_venta: Number(tenantForm.punto_venta),
          domicilio_fiscal: tenantForm.domicilio_fiscal.trim() || null,
          ingresos_brutos: tenantForm.ingresos_brutos.trim() || null,
          condicion_iva: tenantForm.condicion_iva,
          telefono: tenantForm.telefono.trim() || null,
          email: tenantForm.email.trim() || null,
          localidad: tenantForm.localidad.trim() || null,
          provincia: tenantForm.provincia.trim() || null,
          codigo_postal: tenantForm.codigo_postal.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', TENANT_ID)
      if (tenantError) throw tenantError

      // Limpiar contraseñas
      setUserForm(p => ({ ...p, password: '', password2: '' }))
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
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-none">
          <FormErrorBanner show={Object.keys(errors).length > 0} />

          {/* Datos Personales */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Datos Personales</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <FieldWrapper label="Nombre" required error={errors.nombre}>
                <input className={inputCls(errors.nombre)} value={userForm.nombre} onChange={e => setU('nombre', e.target.value)} placeholder="Tu nombre" />
              </FieldWrapper>
              <FieldWrapper label="Email" required error={errors.email}>
                <input className={inputCls(errors.email)} type="email" value={userForm.email} onChange={e => setU('email', e.target.value)} placeholder="tu@email.com" />
              </FieldWrapper>
              <FieldWrapper label="Nueva Contraseña" error={errors.password}>
                <input className={inputCls(errors.password)} type="password" value={userForm.password} onChange={e => setU('password', e.target.value)} placeholder="Dejar vacío para no cambiar" />
              </FieldWrapper>
              <FieldWrapper label="Repetir Contraseña" error={errors.password2}>
                <input className={inputCls(errors.password2)} type="password" value={userForm.password2} onChange={e => setU('password2', e.target.value)} placeholder="Repetir nueva contraseña" />
              </FieldWrapper>
            </div>
          </div>

          {/* Datos de la Empresa */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Datos de la Empresa</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <FieldWrapper label="Razón Social" required error={errors.razon_social}>
                <input className={inputCls(errors.razon_social)} value={tenantForm.razon_social} onChange={e => setT('razon_social', e.target.value)} placeholder="Nombre o Razón Social" />
              </FieldWrapper>
              <FieldWrapper label="CUIT" required error={errors.cuit}>
                <input className={inputCls(errors.cuit)} value={tenantForm.cuit} onChange={e => setT('cuit', e.target.value)} placeholder="20-12345678-9" />
              </FieldWrapper>
              <FieldWrapper label="Domicilio Fiscal">
                <input className={inputCls()} value={tenantForm.domicilio_fiscal} onChange={e => setT('domicilio_fiscal', e.target.value)} placeholder="Calle, número, piso..." />
              </FieldWrapper>
              <FieldWrapper label="Localidad">
                <input className={inputCls()} value={tenantForm.localidad} onChange={e => setT('localidad', e.target.value)} placeholder="Localidad" />
              </FieldWrapper>
              <FieldWrapper label="Provincia">
                <input className={inputCls()} value={tenantForm.provincia} onChange={e => setT('provincia', e.target.value)} placeholder="Provincia" />
              </FieldWrapper>
              <FieldWrapper label="Código Postal">
                <input className={inputCls()} value={tenantForm.codigo_postal} onChange={e => setT('codigo_postal', e.target.value)} placeholder="1234" />
              </FieldWrapper>
              <FieldWrapper label="Teléfono">
                <input className={inputCls()} value={tenantForm.telefono} onChange={e => setT('telefono', e.target.value)} placeholder="+54 11 1234-5678" />
              </FieldWrapper>
              <FieldWrapper label="Email de la Empresa">
                <input className={inputCls()} type="email" value={tenantForm.email} onChange={e => setT('email', e.target.value)} placeholder="empresa@email.com" />
              </FieldWrapper>
              <FieldWrapper label="Ingresos Brutos">
                <input className={inputCls()} value={tenantForm.ingresos_brutos} onChange={e => setT('ingresos_brutos', e.target.value)} placeholder="Nro. IIBB" />
              </FieldWrapper>
              <FieldWrapper label="Fecha de Inicio de Actividades">
                <input className={inputCls()} type="date" value={tenantForm.fecha_inicio_actividades} onChange={e => setT('fecha_inicio_actividades', e.target.value)} />
              </FieldWrapper>
              <FieldWrapper label="Condición frente al IVA">
                <select className={inputCls()} value={tenantForm.condicion_iva} onChange={e => setT('condicion_iva', e.target.value)}>
                  {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Punto de Venta" required error={errors.punto_venta}>
                <input className={inputCls(errors.punto_venta)} type="number" min={1} max={9999} value={tenantForm.punto_venta} onChange={e => setT('punto_venta', e.target.value)} placeholder="0001" />
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