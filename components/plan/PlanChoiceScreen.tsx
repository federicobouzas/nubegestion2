'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Star, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Plan } from '@/lib/plan'

interface Props {
  plan: Plan
  diasVencido: number
}

const PLAN_LABEL: Record<Plan, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  business: 'Business',
}

export default function PlanChoiceScreen({ plan, diasVencido }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleFree() {
    setLoading(true)
    await fetch('/api/plan/elegir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: 'free' }),
    })
    router.refresh()
  }

  async function handleRenovar() {
    setLoading(true)
    await fetch('/api/plan/elegir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: 'renovar' }),
    })
    router.push('/suscripcion')
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#F9F9F8] overflow-y-auto p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11.5px] font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            Plan {PLAN_LABEL[plan]} vencido hace {diasVencido} día{diasVencido === 1 ? '' : 's'}
          </div>
          <h1 className="text-[22px] font-bold text-[#18181B] mb-2">
            ¿Cómo querés continuar?
          </h1>
          <p className="text-[13px] text-[#6B6762]">
            Tu período de gracia terminó. Elegí una opción para seguir usando el sistema.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Renovar */}
          <div className="flex flex-col rounded-[14px] border-2 border-[#F2682E] bg-white p-6 shadow-[0_4px_20px_rgba(242,104,46,0.12)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[8px] bg-[#FEF0EA] flex items-center justify-center">
                <Zap size={15} className="text-[#F2682E]" strokeWidth={2.2} />
              </div>
              <span className="text-[13px] font-semibold text-[#18181B]">Renovar plan {PLAN_LABEL[plan]}</span>
            </div>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {plan === 'pro' && (
                <>
                  <FeatureItem>300 facturas por mes</FeatureItem>
                  <FeatureItem>Hasta 3 usuarios</FeatureItem>
                  <FeatureItem>Todas las funciones</FeatureItem>
                </>
              )}
              {plan === 'business' && (
                <>
                  <FeatureItem>Facturas ilimitadas</FeatureItem>
                  <FeatureItem>Usuarios ilimitados</FeatureItem>
                  <FeatureItem>Soporte prioritario</FeatureItem>
                </>
              )}
            </ul>
            <button
              onClick={handleRenovar}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold px-4 py-2.5 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-60"
            >
              Renovar ahora <ArrowRight size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* Free */}
          <div className="flex flex-col rounded-[14px] border border-[#E5E4E0] bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[8px] bg-[#F9F9F8] flex items-center justify-center">
                <Star size={15} className="text-[#6B6762]" strokeWidth={2.2} />
              </div>
              <span className="text-[13px] font-semibold text-[#18181B]">Continuar gratis</span>
            </div>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              <FeatureItem muted>50 facturas por mes</FeatureItem>
              <FeatureItem muted>1 usuario</FeatureItem>
              <FeatureItem muted>Funciones básicas</FeatureItem>
            </ul>
            <button
              onClick={handleFree}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 text-[12.5px] font-semibold px-4 py-2.5 rounded-[9px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors disabled:opacity-60"
            >
              Usar plan gratuito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-[12px] ${muted ? 'text-[#A8A49D]' : 'text-[#6B6762]'}`}>
      <CheckCircle2 size={12} strokeWidth={2.2} className={muted ? 'text-[#A8A49D]' : 'text-[#4EBB7F]'} />
      {children}
    </li>
  )
}
