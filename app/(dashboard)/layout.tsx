import Sidebar from '@/components/layout/Sidebar'
import SuscripcionAlert from '@/components/suscripcion/SuscripcionAlert'
import { getSuscripcionInfo } from '@/lib/suscripcion'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const suscripcionInfo = await getSuscripcionInfo()

  return (
    <div className="flex h-screen bg-[#F9F9F8] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuscripcionAlert info={suscripcionInfo}>
          {children}
        </SuscripcionAlert>
      </div>
    </div>
  )
}
