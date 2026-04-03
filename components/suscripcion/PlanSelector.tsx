'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import MercadoPagoForm from './MercadoPagoForm'
import type { PlanDef, Plan, PlanInfo } from '@/lib/plan'

interface Props {
  planes: PlanDef[]
  currentInfo: PlanInfo
}

export default function PlanSelector({ planes, currentInfo }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Plan>(currentInfo.plan)
  const [downgradingToFree, setDowngradingToFree] = useState(false)

  const selectedPlan = planes.find(p => p.slug === selected)
  const isCurrent = selected === currentInfo.plan
  const isDowngradeToFree = selected === 'free' && !isCurrent
  const freePlan = planes.find(p => p.slug === 'free')

  function formatPlanDate(isoString: string): string {
    // Tomar solo la parte de fecha (YYYY-MM-DD) para evitar conversión de timezone
    const [year, month, day] = isoString.split('T')[0].split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  async function handleDowngradeToFree() {
    setDowngradingToFree(true)
    await fetch('/api/plan/elegir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice: 'free' }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {planes.map(plan => {
          const isSelected = plan.slug === selected
          const isCur = plan.slug === currentInfo.plan
          return (
            <button
              key={plan.slug}
              onClick={() => setSelected(plan.slug)}
              className={[
                'flex flex-col text-left rounded-[14px] border-2 p-4 transition-all',
                isSelected
                  ? 'border-[#F2682E] bg-white shadow-[0_4px_16px_rgba(242,104,46,0.14)]'
                  : 'border-[#E5E4E0] bg-white hover:border-[#F2682E]/40',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-[#18181B]">{plan.nombre}</span>
                {isCur && (
                  <span className="text-[9.5px] font-mono tracking-wide uppercase text-[#4EBB7F] bg-[#E8F7EF] px-1.5 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <p className="font-mono text-[18px] font-bold text-[#18181B] mb-3">
                {plan.precio === 0
                  ? 'Gratis'
                  : `$${plan.precio.toLocaleString('es-AR')}`}
                {plan.precio > 0 && <span className="text-[10px] font-normal text-[#A8A49D]">/mes</span>}
              </p>
              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f, i) => {
                  const text = f
                    .replace('#FACTURAS_MES#', plan.facturasMes !== null ? String(plan.facturasMes) : 'ilimitadas')
                    .replace('#USUARIOS#', plan.usuarios !== null ? String(plan.usuarios) : 'ilimitados')
                  return (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#6B6762]">
                      <Check size={11} strokeWidth={2.5} className="text-[#4EBB7F] mt-0.5 shrink-0" />
                      {text}
                    </li>
                  )
                })}
              </ul>
              {isSelected && (
                <div className="mt-3 pt-2.5 border-t border-[#F2682E]/20 flex justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#F2682E] flex items-center justify-center">
                    <Check size={9} strokeWidth={3} className="text-white" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {isCurrent && (
        <div className={`rounded-[10px] px-4 py-3 text-[12px] border ${
          currentInfo.plan === 'free' || currentInfo.isActive
            ? 'bg-[#E8F7EF] border-[#4EBB7F]/30 text-[#1A5C38]'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {currentInfo.plan === 'free'
            ? 'Estás en el plan gratuito. Seleccioná Pro o Business para mejorar tu plan.'
            : currentInfo.isActive
              ? currentInfo.planEndsAt
                ? `Plan activo. Vigente hasta el ${formatPlanDate(currentInfo.planEndsAt)}. Podés renovar para sumar 30 días más.`
                : 'Tu plan está activo.'
              : `Tu plan venció ${currentInfo.diasVencido === 0 ? 'hoy' : `hace ${currentInfo.diasVencido} día${currentInfo.diasVencido === 1 ? '' : 's'}`}. Renovalo para continuar.`
          }
        </div>
      )}

      {isDowngradeToFree && (
        <div className="rounded-[14px] border border-[#E5E4E0] bg-white p-5 space-y-3">
          <p className="text-[12.5px] text-[#6B6762]">
            Al pasar al plan gratuito perderás acceso a las funciones del plan {currentInfo.plan} y quedarás limitado a {freePlan?.facturasMes ?? 50} facturas por mes.          
          </p>
          <button
            onClick={handleDowngradeToFree}
            disabled={downgradingToFree}
            className="flex items-center gap-2 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors disabled:opacity-60"
          >
            {downgradingToFree && <Loader2 size={13} className="animate-spin" />}
            Confirmar cambio a Gratuito
          </button>
        </div>
      )}

      {!isCurrent && !isDowngradeToFree && selectedPlan && (
        <div className="rounded-[14px] border border-[#E5E4E0] bg-white shadow-sm p-5">
          <MercadoPagoForm
            key={selected}
            planSlug={selected}
            monto={selectedPlan.precio}
            title={`Cambiar a plan ${selectedPlan.nombre}`}
          />
        </div>
      )}

      {/* Renovar el plan actual (si es pago) */}
      {isCurrent && currentInfo.plan !== 'free' && selectedPlan && (
        <div className="rounded-[14px] border border-[#E5E4E0] bg-white shadow-sm p-5">
          <MercadoPagoForm
            key={`renew-${selected}`}
            planSlug={selected}
            monto={selectedPlan.precio}
            title={`Renovar plan ${selectedPlan.nombre}`}
          />
        </div>
      )}
    </div>
  )
}
