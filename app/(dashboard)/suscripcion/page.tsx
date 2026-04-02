import Topbar from '@/components/shared/Topbar'
import MercadoPagoForm from '@/components/suscripcion/MercadoPagoForm'
import { getPlanInfo } from '@/lib/plan'
import { ShieldCheck } from 'lucide-react'

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  business: 'Business',
}

export default async function SuscripcionPage() {
  const info = await getPlanInfo()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        <div className="w-full max-w-sm space-y-4 pb-6">

          <div className="flex items-start gap-3 px-4 py-3 rounded-[10px] bg-[#E8F7EF] border border-[#4EBB7F]/30">
            <ShieldCheck size={15} className="text-[#1A5C38] mt-0.5 shrink-0" />
            <div>
              <p className="text-[12.5px] font-semibold text-[#1A5C38]">
                Plan {PLAN_LABEL[info.plan] ?? info.plan}
                {info.isActive ? ' activo' : ''}
              </p>
              <p className="text-[11.5px] text-[#1A5C38]/80 mt-0.5">
                {info.plan === 'free'
                  ? 'Hasta 50 facturas por mes, 1 usuario.'
                  : info.planEndsAt
                    ? `Vigente hasta el ${new Date(info.planEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Tu plan está al día.'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E4E0] shadow-sm p-5">
            <MercadoPagoForm />
          </div>
        </div>
      </div>
    </div>
  )
}
