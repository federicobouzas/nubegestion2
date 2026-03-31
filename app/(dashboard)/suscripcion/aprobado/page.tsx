import Link from 'next/link'
import Topbar from '@/components/shared/Topbar'
import { CheckCircle } from 'lucide-react'

export default function SuscripcionAprobadoPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start pt-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E4E0] shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-[#E8F7EF] flex items-center justify-center">
              <CheckCircle size={28} className="text-[#4EBB7F]" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="text-[16px] font-semibold text-[#18181B] mb-2">¡Pago acreditado!</h2>
          <p className="text-[12.5px] text-[#6B6762] mb-6">
            Tu suscripción fue renovada por 30 días. Ya podés continuar usando el sistema.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
