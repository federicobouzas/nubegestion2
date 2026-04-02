'use client'
import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'
import type { PlanInfo } from '@/lib/plan'

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  business: 'Business',
}

interface Props {
  info: PlanInfo
  children: React.ReactNode
}

export default function SuscripcionAlert({ info, children }: Props) {
  // Días para vencer del plan activo (warning)
  const diasParaVencer = info.planEndsAt && info.isActive
    ? Math.floor((new Date(info.planEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const showWarning = info.isActive && diasParaVencer !== null && diasParaVencer <= 7
  const showGrace = info.inGracePeriod

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {showGrace && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-[12px]">
          <Clock size={13} strokeWidth={2.2} className="shrink-0" />
          <span>
            Tu plan {PLAN_LABEL[info.plan] ?? info.plan} venció hace {info.diasVencido} día{info.diasVencido === 1 ? '' : 's'}.{' '}
            <Link href="/suscripcion" className="font-semibold underline underline-offset-2 hover:text-amber-900">
              Renovar ahora
            </Link>
            {' '}para no perder tus beneficios.
          </span>
        </div>
      )}
      {showWarning && !showGrace && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-[12px]">
          <AlertTriangle size={13} strokeWidth={2.2} className="shrink-0" />
          <span>
            Tu plan {PLAN_LABEL[info.plan] ?? info.plan}{' '}
            {diasParaVencer === 0 ? 'vence hoy' : `vence en ${diasParaVencer} día${diasParaVencer === 1 ? '' : 's'}`}.{' '}
            <Link href="/suscripcion" className="font-semibold underline underline-offset-2 hover:text-amber-900">
              Renovar ahora
            </Link>
          </span>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
