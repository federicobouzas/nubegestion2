import Topbar from '@/components/shared/Topbar'
import MercadoPagoForm from '@/components/suscripcion/MercadoPagoForm'
import { getSuscripcionInfo } from '@/lib/suscripcion'
import { ShieldCheck } from 'lucide-react'

export default async function SuscripcionPage() {
  const info = await getSuscripcionInfo()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        <div className="w-full max-w-sm space-y-4 pb-6">

          {info.status === 'ok' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-[10px] bg-[#E8F7EF] border border-[#4EBB7F]/30">
              <ShieldCheck size={15} className="text-[#1A5C38] mt-0.5 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-[#1A5C38]">Suscripción activa</p>
                <p className="text-[11.5px] text-[#1A5C38]/80 mt-0.5">
                  {info.fechaVencimiento
                    ? `Vigente hasta el ${new Date(info.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Tu suscripción está al día.'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E5E4E0] shadow-sm p-5">
            <MercadoPagoForm />
          </div>
        </div>
      </div>
    </div>
  )
}
