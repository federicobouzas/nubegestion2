import { AlertTriangle } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import PlanSelector from '@/components/suscripcion/PlanSelector'
import { getPlanInfo, getPlanes, getFacturasLimitInfo } from '@/lib/plan'

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  business: 'Business',
}

interface Props {
  searchParams: Promise<{ limite?: string }>
}

export default async function SuscripcionPage({ searchParams }: Props) {
  const { limite } = await searchParams
  const showLimiteBanner = limite === 'facturas'

  const [currentInfo, planes, limitInfo] = await Promise.all([
    getPlanInfo(),
    getPlanes(),
    showLimiteBanner ? getFacturasLimitInfo() : Promise.resolve(null),
  ])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto pb-10 space-y-5">

          {showLimiteBanner && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-[12px] bg-[#FEF3C7] border border-[#F59E0B]/40">
              <AlertTriangle size={15} className="text-[#B45309] mt-0.5 shrink-0" strokeWidth={2.2} />
              <p className="text-[12.5px] text-[#92400E] leading-snug">
                Alcanzaste el límite de{' '}
                <span className="font-semibold">
                  {limitInfo?.limit ?? '—'} facturas por mes
                </span>{' '}
                de tu plan <span className="font-semibold">{PLAN_LABEL[currentInfo.plan] ?? currentInfo.plan}</span>.{' '}
                Mejorá el plan para continuar.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-[15px] font-semibold text-[#18181B]">Tu plan</h2>
            <p className="text-[12px] text-[#A8A49D] mt-0.5">Seleccioná el plan que mejor se adapte a tu negocio.</p>
          </div>

          <PlanSelector planes={planes} currentInfo={currentInfo} />
        </div>
      </div>
    </div>
  )
}
