'use client'
import Link from 'next/link'
import { AlertTriangle, XCircle } from 'lucide-react'
import type { SuscripcionInfo } from '@/lib/suscripcion'

interface Props {
  info: SuscripcionInfo
  children: React.ReactNode
}

export default function SuscripcionAlert({ info, children }: Props) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {info.status === 'warning' && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-[12px]">
          <AlertTriangle size={13} strokeWidth={2.2} className="shrink-0" />
          <span>
            Tu suscripción{' '}
            {info.diasRestantes === 0
              ? 'vence hoy'
              : `vence en ${info.diasRestantes} día${info.diasRestantes === 1 ? '' : 's'}`}.{' '}
            <Link
              href="/suscripcion"
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              Renovar ahora
            </Link>
          </span>
        </div>
      )}
      {info.status === 'expired' && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-red-800 text-[12px]">
          <XCircle size={13} strokeWidth={2.2} className="shrink-0" />
          <span>
            Tu suscripción está vencida
            {info.diasRestantes < 0 && ` (hace ${Math.abs(info.diasRestantes)} día${Math.abs(info.diasRestantes) === 1 ? '' : 's'})`}.{' '}
            Realizá el pago para continuar usando el sistema.
          </span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
