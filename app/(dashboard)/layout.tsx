import Sidebar from '@/components/layout/Sidebar'
import SuscripcionAlert from '@/components/suscripcion/SuscripcionAlert'
import PlanChoiceScreen from '@/components/plan/PlanChoiceScreen'
import { getPlanInfo } from '@/lib/plan'
import NextTopLoader from 'nextjs-toploader'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const planInfo = await getPlanInfo()

  return (
    <div className="flex h-screen bg-[#F9F9F8] overflow-hidden">
      <NextTopLoader color="#F97316" showSpinner={false} />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {planInfo.needsChoiceScreen ? (
          <PlanChoiceScreen plan={planInfo.plan} diasVencido={planInfo.diasVencido} />
        ) : (
          <SuscripcionAlert info={planInfo}>
            {children}
          </SuscripcionAlert>
        )}
      </div>
    </div>
  )
}
