'use client'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Script from 'next/script'
import { CreditCard, Loader2 } from 'lucide-react'
import FormErrorModal from '@/components/shared/FormErrorModal'
import type { FieldErrors } from '@/hooks/useFormValidation'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any
  }
}

// Con iframe: false todos los campos son <input> normales que controlamos nosotros
const inputCls = 'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white px-3 text-[12.5px] text-[#18181B] placeholder:text-[#A8A49D] focus:outline-none focus:ring-2 focus:ring-[#F2682E]/30 focus:border-[#F2682E] transition-colors'
const selectCls = 'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white px-3 text-[12.5px] text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F2682E]/30 focus:border-[#F2682E] transition-colors'
const labelCls = 'block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] mb-1'
const fieldErrorCls = 'mt-1 text-[11px] text-red-600'

interface MPCause {
  cause?: string
  field?: string
  message?: string
}

function parseMPCauses(causes: MPCause[]): FieldErrors {
  const errors: FieldErrors = {}
  const seen = new Set<string>()
  const add = (key: string, msg: string) => {
    if (!seen.has(key)) { seen.add(key); errors[key] = msg }
  }
  for (const c of causes) {
    const f = c.message ?? c.field ?? c.cause ?? ''
    if (f.includes('cardNumber'))
      add('cardNumber', 'Revisá el número de tarjeta.')
    else if (f.includes('expiration') || f.includes('Month') || f.includes('Year'))
      add('expiration', 'Revisá la fecha de vencimiento.')
    else if (f.includes('securityCode'))
      add('securityCode', 'Revisá el código de seguridad.')
    else if (f.includes('cardholderName'))
      add('cardholderName', 'Ingresá el nombre del titular.')
    else if (f.includes('identification'))
      add('identification', 'Ingresá tu documento.')
    else if (f.includes('email'))
      add('email', 'Ingresá tu email.')
    else if (c.message)
      add(f || c.message, c.message)
  }
  return errors
}

interface Props {
  planSlug: string
  monto: number
  title: string
}

export default function MercadoPagoForm({ planSlug, monto, title }: Props) {
  const [sdkReady, setSdkReady]   = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [modalOpen, setModalOpen] = useState(false)
  const formInitialized = useRef(false)
  const cardFormRef = useRef<any>(null)

  // Script ya cargado en navegación client-side (onLoad no vuelve a disparar)
  useEffect(() => {
    if (window.MercadoPago) setSdkReady(true)
  }, [])

  const showErrors = (errors: FieldErrors) => {
    flushSync(() => { setFieldErrors(errors); setModalOpen(true) })
  }

  useEffect(() => {
    if (!sdkReady || formInitialized.current) return
    formInitialized.current = true

    const mp = new window.MercadoPago(
      process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
      { locale: 'es-AR' }
    )

    const cardForm = mp.cardForm({
      amount: String(monto),
      iframe: false,
      form: {
        id: 'form-mp-checkout',
        cardNumber:           { id: 'mp-cardNumber',           placeholder: '0000 0000 0000 0000' },
        expirationDate:       { id: 'mp-expirationDate',       placeholder: 'MM/AA' },
        securityCode:         { id: 'mp-securityCode',         placeholder: 'CVV' },
        cardholderName:       { id: 'mp-cardholderName' },
        cardholderEmail:      { id: 'mp-email' },
        identificationNumber: { id: 'mp-identificationNumber' },
        identificationType:   { id: 'mp-identificationType' },
        issuer:               { id: 'mp-issuer' },
        installments:         { id: 'mp-installments' },
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) console.warn('[MP] mount error:', error)
          else setFormReady(true)
        },
        onError: (errors: any) => {
          const list = Array.isArray(errors) ? errors : [errors]
          showErrors(parseMPCauses(list as MPCause[]))
        },
        onSubmit: (event: any) => {
          if (typeof event?.preventDefault === 'function') event.preventDefault()
          flushSync(() => { setFieldErrors({}); setLoading(true) })

          const formData = cardFormRef.current.getCardFormData()

          fetch('/api/suscripcion/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: formData.token,
              issuer_id: formData.issuerId,
              payment_method_id: formData.paymentMethodId,
              transaction_amount: monto,
              installments: parseInt(formData.installments) || 1,
              description: 'Suscripción Nube Gestión',
              plan: planSlug,
              payer: {
                email: formData.cardholderEmail,
                identification: {
                  type: formData.identificationType,
                  number: formData.identificationNumber,
                },
              },
            }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.causes?.length) {
                showErrors(parseMPCauses(data.causes as MPCause[]))
              } else if (data.redirect) {
                window.location.href = data.redirect
              } else {
                showErrors({ general: data.error || 'Ocurrió un error. Intentá de nuevo.' })
              }
            })
            .catch(() => showErrors({ general: 'Error de conexión. Intentá de nuevo.' }))
            .finally(() => flushSync(() => setLoading(false)))
        },
      },
    })
    cardFormRef.current = cardForm

    return () => {
      try { cardForm.unmount() } catch {}
      cardFormRef.current = null
      formInitialized.current = false
      setFormReady(false)
    }
  }, [sdkReady])

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={() => setSdkReady(true)}
      />

      <FormErrorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        errors={fieldErrors}
      />

      <form id="form-mp-checkout" className="space-y-3" action="javascript:void(0)">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E5E4E0]">
          <CreditCard size={15} className="text-[#F2682E]" />
          <span className="text-[12.5px] font-semibold text-[#18181B]">{title}</span>
        </div>

        <div>
          <label className={labelCls} htmlFor="mp-cardNumber">Número de tarjeta</label>
          <input id="mp-cardNumber" type="text" placeholder="0000 0000 0000 0000" className={inputCls} />
          {fieldErrors.cardNumber && <p className={fieldErrorCls}>{fieldErrors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="mp-expirationDate">Vencimiento</label>
            <input id="mp-expirationDate" type="text" placeholder="MM/AA" className={inputCls} />
            {fieldErrors.expiration && <p className={fieldErrorCls}>{fieldErrors.expiration}</p>}
          </div>
          <div>
            <label className={labelCls} htmlFor="mp-securityCode">CVV</label>
            <input id="mp-securityCode" type="text" placeholder="123" className={inputCls} />
            {fieldErrors.securityCode && <p className={fieldErrorCls}>{fieldErrors.securityCode}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="mp-cardholderName">Nombre del titular</label>
          <input id="mp-cardholderName" type="text" placeholder="Como figura en la tarjeta" className={inputCls} />
          {fieldErrors.cardholderName && <p className={fieldErrorCls}>{fieldErrors.cardholderName}</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="mp-email">Email</label>
          <input id="mp-email" type="email" placeholder="correo@ejemplo.com" className={inputCls} />
          {fieldErrors.email && <p className={fieldErrorCls}>{fieldErrors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="mp-identificationType">Tipo de doc.</label>
            <select id="mp-identificationType" className={selectCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="mp-identificationNumber">Número de doc.</label>
            <input id="mp-identificationNumber" type="text" placeholder="12345678" className={inputCls} />
            {fieldErrors.identification && <p className={fieldErrorCls}>{fieldErrors.identification}</p>}
          </div>
        </div>

        <div className="hidden">
          <select id="mp-issuer" />
          <select id="mp-installments" />
        </div>

        <button
          type="submit"
          disabled={loading || !formReady}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Procesando...</> : 'Realizar pago'}
        </button>

        <p className="text-center text-[10.5px] text-[#A8A49D]">
          Pago seguro procesado por MercadoPago
        </p>
      </form>
    </>
  )
}
