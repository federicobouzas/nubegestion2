'use client'
import { useEffect, useRef, useState } from 'react'
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

// Campos iframe (secure): cardNumber, expirationDate, securityCode → <div>
// Campos normales: cardholderName, cardholderEmail, identificationNumber → <input>
// Campos select: identificationType, issuer, installments → <select>

const iframeCls = [
  'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white',
  'transition-colors overflow-hidden',
].join(' ')

const inputCls = [
  'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white px-3',
  'text-[12.5px] text-[#18181B] placeholder:text-[#A8A49D]',
  'focus:outline-none focus:ring-2 focus:ring-[#F2682E]/30 focus:border-[#F2682E]',
  'transition-colors',
].join(' ')

const selectCls = [
  'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white px-3',
  'text-[12.5px] text-[#18181B]',
  'focus:outline-none focus:ring-2 focus:ring-[#F2682E]/30 focus:border-[#F2682E]',
  'transition-colors',
].join(' ')

const labelCls = 'block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] mb-1'

interface MPCause {
  cause: string
  field: string
  message: string
}

function parseMPCauses(causes: MPCause[]): FieldErrors {
  const errors: FieldErrors = {}
  const seen = new Set<string>()

  const add = (key: string, msg: string) => {
    if (!seen.has(key)) { seen.add(key); errors[key] = msg }
  }

  for (const c of causes) {
    const f = c.field

    if (f === 'cardNumber')
      add('cardNumber', 'Revisá el número de tarjeta.')
    else if (f === 'expirationDate' || f === 'expirationMonth' || f === 'expirationYear')
      add('expirationDate', 'Revisá la fecha de vencimiento.')
    else if (f === 'securityCode')
      add('securityCode', 'Revisá el código de seguridad.')
    else if (f === 'cardholderName')
      add('cardholderName', 'Ingresá el nombre del titular.')
    else if (f === 'identificationNumber' || f === 'identificationType')
      add('identification', 'Ingresá tu documento.')
    else if (f === 'cardholderEmail')
      add('email', 'Ingresá tu email.')
    else
      add(f, c.message)
  }

  return errors
}

export default function MercadoPagoForm() {
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalErrors, setModalErrors] = useState<FieldErrors>({})
  const [modalOpen, setModalOpen] = useState(false)
  const formInitialized = useRef(false)
  const cardFormRef = useRef<any>(null)

  const showErrors = (errors: FieldErrors) => {
    setModalErrors(errors)
    setModalOpen(true)
  }

  useEffect(() => {
    if (!sdkReady || formInitialized.current) return
    formInitialized.current = true

    const mp = new window.MercadoPago(
      process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
      { locale: 'es-AR' }
    )

    cardFormRef.current = mp.cardForm({
      amount: process.env.NEXT_PUBLIC_SUSCRIPCION_MONTO || '5000',
      iframe: true,
      form: {
        id: 'form-mp-checkout',
        cardNumber:          { id: 'mp-cardNumber',           placeholder: '0000 0000 0000 0000' },
        expirationDate:      { id: 'mp-expirationDate',       placeholder: 'MM/AA' },
        securityCode:        { id: 'mp-securityCode',         placeholder: 'CVV' },
        cardholderName:      { id: 'mp-cardholderName' },
        cardholderEmail:     { id: 'mp-email' },
        identificationNumber:{ id: 'mp-identificationNumber' },
        identificationType:  { id: 'mp-identificationType' },
        issuer:              { id: 'mp-issuer' },
        installments:        { id: 'mp-installments' },
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) console.warn('MP form mount error:', error)
        },
        onSubmit: async (event: any) => {
          event.preventDefault()
          setLoading(true)

          const {
            token,
            issuerId,
            paymentMethodId,
            installments,
            identificationType,
            identificationNumber,
            cardholderEmail,
          } = cardFormRef.current.getCardFormData()

          try {
            const res = await fetch('/api/suscripcion/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token,
                issuer_id: issuerId,
                payment_method_id: paymentMethodId,
                transaction_amount: parseFloat(process.env.NEXT_PUBLIC_SUSCRIPCION_MONTO || '5000'),
                installments: parseInt(installments) || 1,
                description: 'Suscripción Nube Gestión',
                payer: {
                  email: cardholderEmail,
                  identification: { type: identificationType, number: identificationNumber },
                },
              }),
            })

            const data = await res.json()

            if (res.status === 422 && data.causes) {
              showErrors(parseMPCauses(data.causes))
              return
            }

            if (data.redirect) {
              window.location.href = data.redirect
            } else {
              showErrors({ general: data.error || 'Ocurrió un error. Intentá de nuevo.' })
            }
          } catch {
            showErrors({ general: 'Error de conexión. Intentá de nuevo.' })
          } finally {
            setLoading(false)
          }
        },
      },
    })
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
        errors={modalErrors}
      />

      <form id="form-mp-checkout" className="space-y-3">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E5E4E0]">
          <CreditCard size={15} className="text-[#F2682E]" />
          <span className="text-[12.5px] font-semibold text-[#18181B]">
            Renovar suscripción
          </span>
          <span className="ml-auto font-mono text-[12px] font-bold text-[#18181B]">
            ${(parseInt(process.env.NEXT_PUBLIC_SUSCRIPCION_MONTO || '5000')).toLocaleString('es-AR')}
          </span>
        </div>

        {/* Campos iframe — el SDK inyecta un <iframe> adentro del <div> */}
        <div>
          <label className={labelCls}>Número de tarjeta</label>
          <div id="mp-cardNumber" className={iframeCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Vencimiento</label>
            <div id="mp-expirationDate" className={iframeCls} />
          </div>
          <div>
            <label className={labelCls}>CVV</label>
            <div id="mp-securityCode" className={iframeCls} />
          </div>
        </div>

        {/* Campos normales — el SDK lee .value directamente */}
        <div>
          <label className={labelCls} htmlFor="mp-cardholderName">Nombre del titular</label>
          <input
            id="mp-cardholderName"
            type="text"
            placeholder="Como figura en la tarjeta"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="mp-email">Email</label>
          <input
            id="mp-email"
            type="email"
            placeholder="correo@ejemplo.com"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="mp-identificationType">Tipo de doc.</label>
            <select id="mp-identificationType" className={selectCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="mp-identificationNumber">Número de doc.</label>
            <input
              id="mp-identificationNumber"
              type="text"
              placeholder="12345678"
              className={inputCls}
            />
          </div>
        </div>

        {/* Selects ocultos que el SDK necesita */}
        <div className="hidden">
          <select id="mp-issuer" />
          <select id="mp-installments" />
        </div>

        <button
          type="submit"
          disabled={loading || !sdkReady}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Procesando...</>
          ) : (
            'Realizar pago'
          )}
        </button>

        <p className="text-center text-[10.5px] text-[#A8A49D]">
          Pago seguro procesado por MercadoPago
        </p>
      </form>
    </>
  )
}
