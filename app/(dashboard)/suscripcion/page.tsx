import Topbar from '@/components/shared/Topbar'
import PlanSelector from '@/components/suscripcion/PlanSelector'
import { getPlanInfo, getPlanes } from '@/lib/plan'

export default async function SuscripcionPage() {
  const [currentInfo, planes] = await Promise.all([getPlanInfo(), getPlanes()])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto pb-10">
          <div className="mb-5">
            <h2 className="text-[15px] font-semibold text-[#18181B]">Tu plan</h2>
            <p className="text-[12px] text-[#A8A49D] mt-0.5">Seleccioná el plan que mejor se adapte a tu negocio.</p>
          </div>
          <PlanSelector planes={planes} currentInfo={currentInfo} />
        </div>
      </div>
    </div>
  )
}
