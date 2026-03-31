import Link from 'next/link'
import Topbar from '@/components/shared/Topbar'
import { XCircle } from 'lucide-react'

const MENSAJES: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'Revisá el número de tarjeta.',
  cc_rejected_bad_filled_date: 'Revisá la fecha de vencimiento.',
  cc_rejected_bad_filled_other: 'Revisá los datos ingresados.',
  cc_rejected_bad_filled_security_code: 'Revisá el código de seguridad.',
  cc_rejected_blacklist: 'No pudimos procesar tu pago.',
  cc_rejected_call_for_authorize: 'Debés autorizar el pago ante tu banco.',
  cc_rejected_card_disabled: 'Tu tarjeta está inactiva. Llamá al banco para activarla.',
  cc_rejected_card_error: 'No pudimos procesar tu pago.',
  cc_rejected_duplicated_payment: 'Ya realizaste un pago por ese valor. Intentá con otra tarjeta.',
  cc_rejected_high_risk: 'Tu pago fue rechazado. Intentá con otro medio de pago.',
  cc_rejected_insufficient_amount: 'Tu tarjeta no tiene fondos suficientes.',
  cc_rejected_max_attempts: 'Llegaste al límite de intentos. Usá otra tarjeta.',
  cc_rejected_other_reason: 'Tu tarjeta no procesó el pago.',
}

interface Props {
  searchParams: Promise<{ status_detail?: string; method?: string; amount?: string }>
}

export default async function SuscripcionRechazadoPage({ searchParams }: Props) {
  const params = await searchParams
  const statusDetail = params.status_detail || ''
  const mensaje = MENSAJES[statusDetail] || 'El pago no fue procesado. Intentá de nuevo.'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Cuenta' }, { label: 'Suscripción' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start pt-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E4E0] shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle size={28} className="text-red-500" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="text-[16px] font-semibold text-[#18181B] mb-2">Pago rechazado</h2>
          <p className="text-[12.5px] text-[#6B6762] mb-6">{mensaje}</p>
          <Link
            href="/suscripcion"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            Intentar de nuevo
          </Link>
        </div>
      </div>
    </div>
  )
}
