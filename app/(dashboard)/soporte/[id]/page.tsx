'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getTicket, updateTicket, deleteTicket } from '@/lib/soporte'
import { TIPOS_TICKET, CRITICIDADES, ESTADOS_TICKET } from '@/types/soporte'
import type { Ticket, EstadoTicket, CriticidadTicket, TipoTicket } from '@/types/soporte'

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

const inp = "bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-2 focus:ring-[#F2682E]/10 transition-colors w-full"

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
  const [loading, setLoading] = useState(true)
  const [savingEstado, setSavingEstado] = useState(false)

  useEffect(() => {
    getTicket(id).then(setTicket).catch(console.error).finally(() => setLoading(false))
  }, [id])

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
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[11px] text-[#A8A49D]">{ticket.codigo}</span>
            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${criticidadVariants[ticket.criticidad]}`}>
              {CRITICIDADES[ticket.criticidad]}
            </span>
          </div>
          <h1 className="font-display text-[20px] font-extrabold tracking-tight">{ticket.titulo}</h1>
        </div>
        <span className={`inline-flex items-center text-[12px] font-semibold px-3 py-1 rounded-full ${estadoVariants[ticket.estado]}`}>
          {ESTADOS_TICKET[ticket.estado]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {/* Datos */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Datos del ticket</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">{TIPOS_TICKET[ticket.tipo]}</Field>
              <Field label="Criticidad">{CRITICIDADES[ticket.criticidad]}</Field>
              <Field label="Fecha de creación">
                {new Date(ticket.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Field>
              <Field label="Última actualización">
                {new Date(ticket.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Field>
            </div>
            {ticket.descripcion && (
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Descripción</label>
                <div className="bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-2.5 text-[13px] text-[#18181B] whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</div>
              </div>
            )}
          </div>
        </div>

        {/* Cambiar estado */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Cambiar estado</span>
          </div>
          <div className="p-4 flex gap-2 flex-wrap">
            {(Object.entries(ESTADOS_TICKET) as [EstadoTicket, string][]).map(([k, v]) => (
              <button
                key={k}
                type="button"
                disabled={savingEstado || ticket.estado === k}
                onClick={() => handleEstado(k)}
                className={`text-[12px] font-semibold px-3.5 py-2 rounded-[9px] border transition-colors disabled:opacity-50 ${
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

        <div className="flex justify-end">
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#FEE8E8] text-[#7F1D1D] border border-[#FECACA] hover:bg-[#EE3232] hover:text-white transition-colors">
            <Trash2 size={13} strokeWidth={2} /> Eliminar ticket
          </button>
        </div>
      </div>
    </div>
  )
}
