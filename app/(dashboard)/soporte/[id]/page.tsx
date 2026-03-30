'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2, Send } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getTicket, updateTicket, deleteTicket, getComentariosTicket, addComentarioTicket } from '@/lib/soporte'
import { TIPOS_TICKET, CRITICIDADES, ESTADOS_TICKET } from '@/types/soporte'
import type { Ticket, TicketComentario, EstadoTicket, CriticidadTicket } from '@/types/soporte'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'

const estadoVariants: Record<EstadoTicket, string> = {
  abierto: 'bg-[#E8F7EF] text-[#1A5C38]',
  en_progreso: 'bg-[#FEF8E1] text-[#7A5500]',
  resuelto: 'bg-[#E8EEF3] text-[#2B445A]',
  cerrado: 'bg-[#F1F0EE] text-[#6B6762]',
}

const criticidadVariants: Record<CriticidadTicket, string> = {
  baja: 'bg-[#E8EEF3] text-[#2B445A]',
  media: 'bg-[#FEF8E1] text-[#7A5500]',
  alta: 'bg-[#FEF0EA] text-[#C94E18]',
  critica: 'bg-[#FEE8E8] text-[#7F1D1D]',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">{label}</label>
      <div className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] min-h-[38px] flex items-center">{children}</div>
    </div>
  )
}

export default function VerTicketPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comentarios, setComentarios] = useState<TicketComentario[]>([])
  const [razonSocial, setRazonSocial] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingEstado, setSavingEstado] = useState(false)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [tipoAutor, setTipoAutor] = useState<'usuario' | 'soporte'>('usuario')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const tenantId = await getTenantId()
      const supabase = createClient()
      const [ticketRes, comentariosRes, configRes] = await Promise.all([
        getTicket(id),
        getComentariosTicket(id),
        supabase.from('configuracion').select('razon_social').eq('tenant_id', tenantId).single(),
      ])
      setTicket(ticketRes)
      setComentarios(comentariosRes || [])
      setRazonSocial(configRes.data?.razon_social || 'Usuario')
      setLoading(false)
    }
    load().catch(console.error)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comentarios])

  async function handleEstado(nuevoEstado: EstadoTicket) {
    if (!ticket) return
    setSavingEstado(true)
    try {
      const updated = await updateTicket(id, { estado: nuevoEstado })
      setTicket(updated)
    } finally {
      setSavingEstado(false)
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoComentario.trim() || !ticket) return
    setEnviando(true)
    try {
      const res = await fetch('/api/soporte/comentario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: id, contenido: nuevoComentario.trim(), tipo_autor: tipoAutor }),
      })
      if (!res.ok) throw new Error('Error al enviar')
      const { comentario } = await res.json()
      setComentarios(prev => [...prev, comentario])
      setNuevoComentario('')
      if (ticket.estado === 'abierto') {
        const updated = await updateTicket(id, { estado: 'en_progreso' })
        setTicket(prev => prev ? { ...prev, estado: updated.estado } : prev)
      }
    } finally {
      setEnviando(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este ticket?')) return
    await deleteTicket(id)
    router.push('/soporte')
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
  if (!ticket) return <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">No encontrado.</div>

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Soporte', href: '/soporte' }, { label: ticket.codigo }]} />

      {/* Header */}
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] text-[#A8A49D] mb-0.5">
            {ticket.codigo} · {TIPOS_TICKET[ticket.tipo]} · {new Date(ticket.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[20px] font-extrabold tracking-tight">{ticket.titulo}</h1>
            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${criticidadVariants[ticket.criticidad]}`}>
              {CRITICIDADES[ticket.criticidad]}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {(Object.entries(ESTADOS_TICKET) as [EstadoTicket, string][]).map(([k, v]) => (
            <button
              key={k}
              type="button"
              disabled={savingEstado || ticket.estado === k}
              onClick={() => handleEstado(k)}
              className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-[8px] border transition-colors disabled:opacity-50 ${
                ticket.estado === k
                  ? `${estadoVariants[k]} border-transparent cursor-default`
                  : 'border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#A8A49D]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">

        {/* Conversación */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Conversación</span>
          </div>

          {/* Mensajes */}
          <div className="p-4 flex flex-col gap-3 min-h-[80px]">
            {/* Descripción como primer mensaje del usuario */}
            {ticket.descripcion && (
              <div className="flex gap-2.5 flex-row">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-[#2B445A] text-white uppercase" title={razonSocial}>
                  {razonSocial.slice(0, 2)}
                </div>
                <div className="max-w-[75%] flex flex-col gap-0.5 items-start">
                  <div className="px-3 py-2 rounded-[10px] rounded-tl-[3px] text-[12.5px] leading-relaxed whitespace-pre-wrap bg-[#F1F0EE] text-[#18181B]">
                    {ticket.descripcion}
                  </div>
                  <span className="font-mono text-[9.5px] text-[#A8A49D]">
                    {razonSocial} · {new Date(ticket.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}
            {comentarios.length === 0 && !ticket.descripcion ? (
              <p className="text-[12px] text-[#A8A49D] text-center py-4">Aún no hay comentarios.</p>
            ) : comentarios.map(c => {
              const esSoporte = c.tipo_autor === 'soporte'
              const autorNombre = esSoporte ? 'Soporte' : razonSocial
              const autorInitials = autorNombre.slice(0, 2).toUpperCase()
              return (
                <div key={c.id} className={`flex gap-2.5 ${esSoporte ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${esSoporte ? 'bg-[#F2682E] text-white' : 'bg-[#2B445A] text-white'}`} title={autorNombre}>
                    {autorInitials}
                  </div>
                  <div className={`max-w-[75%] flex flex-col gap-0.5 ${esSoporte ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 rounded-[10px] text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                      esSoporte
                        ? 'bg-[#FEF0EA] text-[#18181B] rounded-tr-[3px]'
                        : 'bg-[#F1F0EE] text-[#18181B] rounded-tl-[3px]'
                    }`}>
                      {c.contenido}
                    </div>
                    <span className="font-mono text-[9.5px] text-[#A8A49D]">
                      {autorNombre} · {new Date(c.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input nuevo comentario */}
          {ticket.estado !== 'cerrado' && (
            <div className="border-t border-[#E5E4E0] p-4">
              <form onSubmit={handleEnviar} className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Escribir como</span>
                  <div className="flex rounded-[7px] border border-[#E5E4E0] overflow-hidden">
                    {(['usuario', 'soporte'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setTipoAutor(t)}
                        className={`px-3 py-1 text-[11.5px] font-semibold transition-colors ${tipoAutor === t ? (t === 'soporte' ? 'bg-[#F2682E] text-white' : 'bg-[#2B445A] text-white') : 'bg-white text-[#6B6762] hover:bg-[#F9F9F8]'}`}>
                        {t === 'soporte' ? 'Soporte' : 'Usuario'}
                      </button>
                    ))}
                  </div>
                  {tipoAutor === 'soporte' && (
                    <span className="text-[11px] text-[#F2682E] font-medium">Se enviará un email al usuario</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[12.5px] text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-2 focus:ring-[#F2682E]/10 transition-colors resize-none placeholder:text-[#A8A49D]"
                    rows={2}
                    placeholder="Escribí tu respuesta..."
                    value={nuevoComentario}
                    onChange={e => setNuevoComentario(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleEnviar(e as any) }}
                  />
                  <button
                    type="submit"
                    disabled={enviando || !nuevoComentario.trim()}
                    className="self-end flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
                  >
                    <Send size={12} strokeWidth={2.2} /> Enviar
                  </button>
                </div>
                <span className="text-[10px] text-[#A8A49D]">Cmd+Enter para enviar</span>
              </form>
            </div>
          )}
          {ticket.estado === 'cerrado' && (
            <div className="border-t border-[#E5E4E0] px-4 py-3 text-[12px] text-[#A8A49D] text-center">
              Este ticket está cerrado. No se pueden agregar más comentarios.
            </div>
          )}
        </div>


        <div className="flex justify-end">
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors">
            <Trash2 size={13} strokeWidth={2} /> Eliminar ticket
          </button>
        </div>
      </div>
    </div>
  )
}
