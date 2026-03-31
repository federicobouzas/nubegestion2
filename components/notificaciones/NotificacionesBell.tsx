'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import type { Notificacion, TipoNotificacion } from '@/lib/notificaciones'
import { ICONOS, getNavegacion, tiempoRelativo } from '@/lib/notificaciones'

const POLL_INTERVAL = 60_000 // 60 segundos

export default function NotificacionesBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingAll, setLoadingAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // ── Fetch ──────────────────────────────────────────────────
  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones')
      if (!res.ok) return
      const json = await res.json()
      setNotificaciones(json.notificaciones ?? [])
      setUnreadCount(json.unreadCount ?? 0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotificaciones()
    const interval = setInterval(fetchNotificaciones, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotificaciones])

  // ── Click fuera para cerrar ────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // ── Marcar una como leída y navegar ───────────────────────
  async function handleClick(notif: Notificacion) {
    if (!notif.leida) {
      await fetch(`/api/notificaciones/${notif.id}/leer`, { method: 'PATCH' })
      setNotificaciones(prev =>
        prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
    router.push(getNavegacion(notif.tipo, notif.referencia_id))
  }

  // ── Marcar todas como leídas ──────────────────────────────
  async function handleLeerTodas() {
    setLoadingAll(true)
    try {
      await fetch('/api/notificaciones/leer-todas', { method: 'PATCH' })
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
      setUnreadCount(0)
    } finally {
      setLoadingAll(false)
    }
  }

  // ── Badge label ───────────────────────────────────────────
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <div className="relative">
      {/* Botón campana */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative group w-8 h-8 rounded-[9px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
      >
        <Bell size={14} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-[3px] rounded-full bg-[#EE3232] text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {badgeLabel}
          </span>
        )}
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#18181B] text-white text-[11px] font-medium px-2 py-1 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity z-50">
          Notificaciones
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-white border border-[#E5E4E0] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F0EE] bg-[#F9F9F8]">
            <span className="font-display text-[13.5px] font-bold text-[#18181B]">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-[11px] font-semibold text-[#EE3232]">
                  {unreadCount} sin leer
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleLeerTodas}
                disabled={loadingAll}
                className="text-[11px] font-medium text-[#F2682E] hover:text-[#C94E18] transition-colors disabled:opacity-50"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <span className="text-3xl mb-2">🔔</span>
                <p className="text-[13px] font-semibold text-[#18181B]">Todo al día</p>
                <p className="text-[12px] text-[#A8A49D] mt-0.5">No tenés notificaciones pendientes</p>
              </div>
            ) : (
              notificaciones.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-[#F1F0EE] last:border-0 transition-colors ${
                    notif.leida
                      ? 'hover:bg-[#F9F9F8]'
                      : 'bg-[#FEF0EA] hover:bg-[#FDE8DC]'
                  }`}
                >
                  {/* Ícono tipo */}
                  <span className="text-[18px] flex-shrink-0 mt-0.5">
                    {ICONOS[notif.tipo]}
                  </span>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12.5px] leading-snug ${notif.leida ? 'text-[#6B6762]' : 'text-[#18181B] font-medium'}`}>
                      {notif.mensaje}
                    </p>
                    <p className="text-[11px] text-[#A8A49D] mt-0.5">
                      {tiempoRelativo(notif.created_at)}
                    </p>
                  </div>

                  {/* Punto no leída */}
                  {!notif.leida && (
                    <span className="w-2 h-2 rounded-full bg-[#F2682E] flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
