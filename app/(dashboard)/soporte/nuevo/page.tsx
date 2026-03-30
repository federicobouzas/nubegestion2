'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { createTicket } from '@/lib/soporte'
import { TIPOS_TICKET, CRITICIDADES } from '@/types/soporte'
import type { TipoTicket, CriticidadTicket } from '@/types/soporte'

const inp = "bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-2 focus:ring-[#F2682E]/10 transition-colors placeholder:text-[#A8A49D] placeholder:font-normal w-full"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">
        {label}{required && <span className="text-[#F2682E] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function NuevoTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: '' as TipoTicket | '',
    criticidad: '' as CriticidadTicket | '',
    estado: 'abierto' as const,
  })

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return }
    if (!form.tipo) { setError('El tipo es obligatorio.'); return }
    if (!form.criticidad) { setError('La criticidad es obligatoria.'); return }
    if (!form.descripcion.trim()) { setError('La descripción es obligatoria.'); return }
    setLoading(true); setError(null)
    try {
      const ticket = await createTicket(form)
      router.push(`/soporte/${ticket.id}`)
    } catch (err: any) { setError(err.message || 'Error.'); setLoading(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Soporte', href: '/soporte' }, { label: 'Nuevo ticket' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Nuevo Ticket</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="bg-[#FEE8E8] border border-[#FECACA] text-[#7F1D1D] text-[13px] rounded-lg px-4 py-3">{error}</div>}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
              <span className="font-display text-[13.5px] font-bold">Datos del ticket</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Field label="Título" required>
                <input className={inp} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Resumen breve del problema o consulta" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo" required>
                  <select className={inp} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    <option value="">Seleccionar tipo...</option>
                    {(Object.entries(TIPOS_TICKET) as [TipoTicket, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Criticidad" required>
                  <select className={inp} value={form.criticidad} onChange={e => set('criticidad', e.target.value)}>
                    <option value="">Seleccionar criticidad...</option>
                    {(Object.entries(CRITICIDADES) as [CriticidadTicket, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Descripción" required>
                <textarea className={inp} rows={5} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detallá el problema, los pasos para reproducirlo o tu consulta..." />
              </Field>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"><X size={13} strokeWidth={2.2} /> Cancelar</button>
            <button type="submit" disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"><Save size={13} strokeWidth={2.2} /> {loading ? 'Enviando...' : 'Enviar ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
