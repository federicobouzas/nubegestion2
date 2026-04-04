'use client'
import { useEffect, useState } from 'react'
import { Save, Plus, Check, X, Trash2, UserCheck, UserX } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import FieldWrapper, { inputCls, inputSmCls } from '@/components/shared/FieldWrapper'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import { createClient } from '@/lib/supabase'

const CONDICIONES_IVA = ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor Final']

interface UsuarioRow {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  confirmDelete?: boolean
}

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserRol, setCurrentUserRol] = useState('')

  const [userForm, setUserForm] = useState({
    nombre: '',
    email: '',
    password: '',
    password2: '',
    rol: '',
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

  const [planInfo, setPlanInfo] = useState<{
    nombre: string
    plan_ends_at: string | null
    facturasMes: number | null
    usuariosMax: number | null
  } | null>(null)

  const [usuariosCount, setUsuariosCount] = useState(1)
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', rol: 'usuario' })
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null)
  const [addUserError, setAddUserError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setCurrentUserId(user.id)

      const { data: u } = await supabase
        .from('usuarios')
        .select('nombre, email, rol, tenant_id')
        .eq('id', user.id)
        .single()

      if (!u) { setLoading(false); return }

      setCurrentUserRol(u.rol)
      setUserForm(p => ({ ...p, nombre: u.nombre || '', email: u.email || '', rol: u.rol || '' }))

      const tenantId = u.tenant_id

      const { data: t } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
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

        if (t.plan) {
          const { data: planDef } = await supabase
            .from('planes')
            .select('nombre, facturas_mes, usuarios')
            .eq('slug', t.plan)
            .single()

          setPlanInfo({
            nombre: planDef?.nombre || t.plan,
            plan_ends_at: t.plan_ends_at || null,
            facturasMes: planDef?.facturas_mes ?? null,
            usuariosMax: planDef?.usuarios ?? null,
          })
        }
      }

      const { count: totalUsuarios } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
      setUsuariosCount(Math.max(1, totalUsuarios ?? 1))

      if (u.rol === 'admin') {
        const { data: us } = await supabase
          .from('usuarios')
          .select('id, nombre, email, rol, activo')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: true })

        if (us) setUsuarios(us)
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
    if (!tenantForm.punto_venta || Number(tenantForm.punto_venta) < 1)
      newErrors['punto_venta'] = 'El punto de venta debe ser mayor a 0.'

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setShowModal(true); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: u } = await supabase
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!u?.tenant_id) throw new Error('Sin tenant')

      const { error: userError } = await supabase
        .from('usuarios')
        .update({ nombre: userForm.nombre.trim(), email: userForm.email.trim() })
        .eq('id', user.id)
      if (userError) throw userError

      if (userForm.password) {
        const { error: passError } = await supabase.auth.updateUser({ password: userForm.password })
        if (passError) throw passError
      }

      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          razon_social: tenantForm.razon_social.trim(),
          cuit: tenantForm.cuit.trim() || null,
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
        })
        .eq('id', u.tenant_id)
      if (tenantError) throw tenantError

      setUserForm(p => ({ ...p, password: '', password2: '' }))
      setSaved(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar.'
      setErrors({ _server: msg })
      setShowModal(true)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddUser() {
    if (!newUser.nombre.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setAddUserError('Nombre, email y contraseña son requeridos.')
      return
    }
    setAddUserError('')
    setUserActionLoading('new')
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newUser.nombre.trim(), email: newUser.email.trim(), password: newUser.password, rol: newUser.rol }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario.')

      setUsuarios(p => [...p, { id: data.id, nombre: newUser.nombre.trim(), email: newUser.email.trim(), rol: newUser.rol, activo: true }])
      setUsuariosCount(c => c + 1)
      setNewUser({ nombre: '', email: '', password: '', rol: 'usuario' })
      setAddingUser(false)
    } catch (err: unknown) {
      setAddUserError(err instanceof Error ? err.message : 'Error al crear usuario.')
    } finally {
      setUserActionLoading(null)
    }
  }

  async function handleToggleUser(id: string, activo: boolean) {
    setUserActionLoading(id)
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      })
      if (!res.ok) throw new Error('Error al actualizar usuario.')
      setUsuarios(p => p.map(u => u.id === id ? { ...u, activo: !activo } : u))
    } catch {
      // silently fail — state stays unchanged
    } finally {
      setUserActionLoading(null)
    }
  }

  function requestDeleteUser(id: string) {
    setUsuarios(p => p.map(u => u.id === id ? { ...u, confirmDelete: true } : u))
  }

  function cancelDeleteUser(id: string) {
    setUsuarios(p => p.map(u => u.id === id ? { ...u, confirmDelete: false } : u))
  }

  async function handleDeleteUser(id: string) {
    setUserActionLoading(id)
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar usuario.')
      setUsuarios(p => p.filter(u => u.id !== id))
      setUsuariosCount(c => c - 1)
    } catch {
      setUsuarios(p => p.map(u => u.id === id ? { ...u, confirmDelete: false } : u))
    } finally {
      setUserActionLoading(null)
    }
  }

  function cancelAddUser() {
    setAddingUser(false)
    setNewUser({ nombre: '', email: '', password: '', rol: 'usuario' })
    setAddUserError('')
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    const [y, m, day] = d.split('T')[0].split('-')
    return `${day}/${m}/${y}`
  }

  const canAddUser = planInfo === null || planInfo.usuariosMax === null || usuariosCount < planInfo.usuariosMax

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

          {/* Sección 1 — Datos Personales */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">Datos Personales</span>
              {userForm.rol && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F7EF] text-[#1A5C38]">
                  {userForm.rol === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              )}
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

          {/* Sección 2 — Datos de la Empresa */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Datos de la Empresa</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <FieldWrapper label="Razón Social" required error={errors.razon_social}>
                <input className={inputCls(errors.razon_social)} value={tenantForm.razon_social} onChange={e => setT('razon_social', e.target.value)} placeholder="Nombre o Razón Social" />
              </FieldWrapper>
              <FieldWrapper label="CUIT" error={errors.cuit}>
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

          {/* Sección 3 — Plan (read-only) */}
          {planInfo && (
            <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
                <span className="font-display text-[13.5px] font-bold">Plan</span>
              </div>
              <div className="p-4 grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Nombre</span>
                  <span className="text-[13px] font-semibold text-[#18181B]">{planInfo.nombre}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Vencimiento</span>
                  <span className="text-[13px] font-medium text-[#6B6762]">{formatDate(planInfo.plan_ends_at)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Facturas / mes</span>
                  <span className="text-[13px] font-medium text-[#6B6762]">{planInfo.facturasMes === null ? 'Ilimitadas' : planInfo.facturasMes}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Usuarios</span>
                  <span className="text-[13px] font-medium text-[#6B6762]">{usuariosCount}/{planInfo.usuariosMax === null ? '∞' : planInfo.usuariosMax}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sección 4 — Usuarios */}
          {currentUserRol === 'admin' && (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm mt-4">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">Usuarios</span>
              <div className="relative group/addbtn">
                <button
                  type="button"
                  disabled={!canAddUser || addingUser}
                  onClick={() => setAddingUser(true)}
                  className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-[7px] bg-[#F2682E] text-white shadow-[0_2px_8px_rgba(242,104,46,0.25)] hover:bg-[#C94E18] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={12} strokeWidth={2.2} /> Agregar usuario
                </button>
                {!canAddUser && (
                  <div className="absolute right-0 top-full mt-1.5 z-10 bg-[#1F3247] text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/addbtn:opacity-100 transition-opacity pointer-events-none">
                    Límite de usuarios alcanzado. Actualizá tu plan.
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F9F9F8] border-b border-[#E5E4E0]">
                    <th className="text-left px-4 py-2.5 font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Nombre</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Email</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Rol</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Estado</th>
                    <th className="px-4 py-2.5 font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className="border-b border-[#E5E4E0] last:border-0 hover:bg-[#FEF0EA] group transition-colors">
                      <td className="px-4 py-2.5 text-[12px] text-[#6B6762]">{u.nombre}</td>
                      <td className="px-4 py-2.5 text-[12px] text-[#6B6762] font-mono">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F0EE] text-[#6B6762]">
                          {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          u.activo ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#FEE8E8] text-[#7F1D1D]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-[#4EBB7F]' : 'bg-[#EE3232]'}`} />
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {u.confirmDelete ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[11px] text-[#7F1D1D] font-medium">¿Confirmar eliminación?</span>
                            <button
                              type="button"
                              disabled={userActionLoading === u.id}
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px] bg-[#EE3232] text-white hover:bg-[#C62020] transition-colors disabled:opacity-50"
                            >
                              Eliminar
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelDeleteUser(u.id)}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {u.id !== currentUserId && (
                              <>
                                <button
                                  type="button"
                                  disabled={userActionLoading === u.id}
                                  onClick={() => handleToggleUser(u.id, u.activo)}
                                  title={u.activo ? 'Desactivar' : 'Activar'}
                                  className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors disabled:opacity-50"
                                >
                                  {u.activo ? <UserX size={13} strokeWidth={2} /> : <UserCheck size={13} strokeWidth={2} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestDeleteUser(u.id)}
                                  title="Eliminar"
                                  className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors"
                                >
                                  <Trash2 size={13} strokeWidth={2} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {addingUser && (
                    <tr className="border-b border-[#E5E4E0] last:border-0 bg-[#FAFAF9]">
                      <td className="px-3 py-2">
                        <input
                          className={inputSmCls()}
                          placeholder="Nombre"
                          value={newUser.nombre}
                          onChange={e => setNewUser(p => ({ ...p, nombre: e.target.value }))}
                          autoFocus
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={inputSmCls()}
                          type="email"
                          placeholder="Email"
                          value={newUser.email}
                          onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className={inputSmCls()}
                          value={newUser.rol}
                          onChange={e => setNewUser(p => ({ ...p, rol: e.target.value }))}
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={inputSmCls()}
                          type="password"
                          placeholder="Contraseña"
                          value={newUser.password}
                          onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1 items-end">
                          {addUserError && <span className="text-[10px] text-[#EE3232] font-medium text-right">{addUserError}</span>}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={userActionLoading === 'new'}
                              onClick={handleAddUser}
                              className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#4EBB7F] hover:border-[#4EBB7F] transition-colors disabled:opacity-50"
                            >
                              <Check size={13} strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelAddUser}
                              className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors"
                            >
                              <X size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {usuarios.length === 0 && !addingUser && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">
                        No hay otros usuarios en este tenant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Botón guardar */}
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
