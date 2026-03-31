'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { getTaller, deleteTaller } from '@/lib/produccion'
import type { Taller } from '@/types/produccion'

export default function TallerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getTaller(id).then(setTaller).finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('¿Eliminar este taller?')) return
    setDeleting(true)
    try {
      await deleteTaller(id)
      router.push('/talleres')
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar.')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Talleres', href: '/talleres' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  if (!taller) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Talleres', href: '/talleres' }, { label: 'No encontrado' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Taller no encontrado.</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[
          { label: 'Producción' },
          { label: 'Talleres', href: '/talleres' },
          { label: taller.nombre },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/talleres/${id}/editar`}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
            >
              <Pencil size={13} strokeWidth={2} /> Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] border border-[#FEE8E8] bg-[#FEE8E8] text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} strokeWidth={2} /> Eliminar
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-6 shadow-sm max-w-lg">
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-1">Nombre</div>
              <div className="text-[15px] font-bold text-[#18181B]">{taller.nombre}</div>
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-1">Fecha de Alta</div>
              <div className="font-mono text-[12px] text-[#6B6762]">{new Date(taller.created_at).toLocaleDateString('es-AR')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
