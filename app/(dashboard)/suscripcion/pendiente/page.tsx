import Link from 'next/link'
import Topbar from '@/components/shared/Topbar'
import { Clock } from 'lucide-react'

interface Props {
  searchParams: Promise<{ status_detail?: string; method?: string }>
}

export default async function SuscripcionPendientePage({ searchParams }: Props) {
  const params = await searchParams
  const statusDetail = params.status_detail || ''
  const method = params.method || ''

  let mensaje = 'Estamos procesando tu pago. Te notificaremos cuando se acredite.'
  if (statusDetail === 'pending_contingency') {
    mensaje = 'En menos de una hora te enviaremos por e-mail el resultado.'
  } else if (statusDetail === 'pending_review_manual') {
    mensaje = 'En menos de 2 días hábiles te diremos por e-mail si se acreditó o si necesitamos más información.'
  } else if (method === 'pagofacil' || method === 'rapipago' || method === 'redlink') {
    mensaje = `Imprimí el comprobante y abonalo en el local ${method} más cercano.`
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start pt-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E4E0] shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock size={28} className="text-amber-500" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="text-[16px] font-semibold text-[#18181B] mb-2">Pago pendiente</h2>
          <p className="text-[12.5px] text-[#6B6762] mb-6">{mensaje}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-white text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
