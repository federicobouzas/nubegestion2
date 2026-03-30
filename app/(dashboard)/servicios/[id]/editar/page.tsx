'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getServicio, updateServicio } from '@/lib/servicios'

const inp = "bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-2 focus:ring-[#F2682E]/10 transition-colors placeholder:text-[#A8A49D] placeholder:font-normal w-full"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">{label}</label>
      {children}
    </div>
  )
}

export default function EditarServicioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    getServicio(id)
      .then(s => setForm(s))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function set(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre?.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true); setError(null)
    try {
      await updateServicio(id, { nombre: form.nombre, descripcion: form.descripcion, iva: form.iva, estado: form.estado })
      router.push('/servicios')
    } catch (err: any) { setError(err.message || 'Error.'); setSaving(false) }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Servicios', href: '/servicios' }, { label: form.nombre || '—' }, { label: 'Editar' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Editar Servicio</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="bg-[#FEE8E8] border border-[#FECACA] text-[#7F1D1D] text-[13px] rounded-lg px-4 py-3">{error}</div>}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Datos del servicio</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Nombre">
                  <input className={inp} value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del servicio" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Descripción">
                  <textarea className={inp} rows={2} value={form.descripcion || ''} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional" />
                </Field>
              </div>
              <Field label="IVA">
                <select className={inp} value={form.iva} onChange={e => set('iva', parseFloat(e.target.value))}>
                  {[0, 2.5, 5, 10.5, 21, 27].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </Field>
              <Field label="Estado">
                <select className={inp} value={form.estado} onChange={e => set('estado', e.target.value)}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
