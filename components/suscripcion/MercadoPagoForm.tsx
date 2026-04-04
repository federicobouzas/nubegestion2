'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { CreditCard, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any
  }
}

// iframe: true — los campos sensibles (cardNumber, CVV) son iframes montados por MP.
// Los containers necesitan height + overflow:hidden para que el iframe se vea como un input.
const iframeCls = 'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white overflow-hidden'
const inputCls = 'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white px-3 text-[12.5px] text-[#18181B] placeholder:text-[#A8A49D] focus:outline-none focus:ring-2 focus:ring-[#F2682E]/30 focus:border-[#F2682E] transition-colors'
const selectCls = 'w-full h-[38px] rounded-[8px] border border-[#E5E4E0] bg-white px-3 text-[12.5px] text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#F2682E]/30 focus:border-[#F2682E] transition-colors'
const labelCls = 'block font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] mb-1'

interface Props {
  planSlug: string
  monto: number
  title: string
}

export default function MercadoPagoForm({ planSlug, monto, title }: Props) {
  const router = useRouter()
  const [sdkReady, setSdkReady]   = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(false)
  const formInitialized = useRef(false)
  const cardFormRef     = useRef<any>(null)
  const emailRef        = useRef<string>('')

  // Obtener email del usuario autenticado
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        emailRef.current = data.user.email
      }
    })
  }, [])

  // El SDK puede ya estar cargado por navegación client-side (onLoad no vuelve a disparar)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.MercadoPago) setSdkReady(true)
  }, [])

  useEffect(() => {
    if (!sdkReady || formInitialized.current) return
    formInitialized.current = true

    const mp = new window.MercadoPago(
      process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
      { locale: 'es-AR' }
    )

    const cardForm = mp.cardForm({
      amount: String(monto),
      iframe: true,
      form: {
        id: 'form-checkout',
        cardNumber:           { id: 'form-checkout__cardNumber',           placeholder: 'Número de tarjeta' },
        expirationDate:       { id: 'form-checkout__expirationDate',       placeholder: 'MM/AA' },
        securityCode:         { id: 'form-checkout__securityCode',         placeholder: 'CVV' },
        cardholderName:       { id: 'form-checkout__cardholderName',       placeholder: 'Como figura en la tarjeta' },
        issuer:               { id: 'form-checkout__issuer',               placeholder: 'Banco emisor' },
        installments:         { id: 'form-checkout__installments',         placeholder: 'Cuotas' },
        identificationType:   { id: 'form-checkout__identificationType' },
        identificationNumber: { id: 'form-checkout__identificationNumber', placeholder: 'DNI' },
        cardholderEmail:      { id: 'form-checkout__cardholderEmail' },
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) {
            console.warn('[MP] mount error:', error)
          } else {
            setFormReady(true)
            // Pre-cargar email en el campo oculto
            const el = document.getElementById('form-checkout__cardholderEmail') as HTMLInputElement | null
            if (el && emailRef.current) el.value = emailRef.current
            // En dev, auto-completar los inputs normales con datos de prueba
            if (process.env.NODE_ENV === 'development') {
              const cardholderName = document.getElementById('form-checkout__cardholderName') as HTMLInputElement | null
              const identificationNumber = document.getElementById('form-checkout__identificationNumber') as HTMLInputElement | null
              if (cardholderName) cardholderName.value = 'APRO'
              if (identificationNumber) identificationNumber.value = '12345678'
            }
          }
        },
        onFetching: (_resource: string) => {
          setFetching(true)
          return () => setFetching(false)
        },
        onSubmit: async (event: any) => {
          if (typeof event?.preventDefault === 'function') event.preventDefault()
          setLoading(true)

          try {
            // Asegurar que el email esté pre-cargado antes de tokenizar
            const emailEl = document.getElementById('form-checkout__cardholderEmail') as HTMLInputElement | null
            if (emailEl && emailRef.current && !emailEl.value) {
              emailEl.value = emailRef.current
            }

            const { token, paymentMethodId } = cardFormRef.current.getCardFormData()

            const res = await fetch('/api/mercadopago/pagar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan_slug: planSlug, token, paymentMethodId }),
            })
            const data = await res.json()

            if (data.status === 'approved') {
              router.push('/suscripcion/aprobado')
            } else if (data.status === 'rejected') {
              router.push('/suscripcion/rechazado')
            } else {
              router.push('/suscripcion/pendiente')
            }
          } catch {
            router.push('/suscripcion/rechazado')
          } finally {
            setLoading(false)
          }
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

      <form id="form-checkout" className="space-y-3" action="javascript:void(0)">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E5E4E0]">
          <CreditCard size={15} className="text-[#F2682E]" />
          <span className="text-[12.5px] font-semibold text-[#18181B]">{title}</span>
        </div>

        <div>
          <label className={labelCls}>Número de tarjeta</label>
          <div id="form-checkout__cardNumber" className={iframeCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Vencimiento</label>
            <div id="form-checkout__expirationDate" className={iframeCls} />
          </div>
          <div>
            <label className={labelCls}>CVV</label>
            <div id="form-checkout__securityCode" className={iframeCls} />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="form-checkout__cardholderName">Nombre del titular</label>
          <input
            id="form-checkout__cardholderName"
            type="text"
            placeholder="Como figura en la tarjeta"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="form-checkout__identificationType">Tipo de doc.</label>
            <select id="form-checkout__identificationType" className={selectCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="form-checkout__identificationNumber">Número de doc.</label>
            <input
              id="form-checkout__identificationNumber"
              type="text"
              placeholder="12345678"
              maxLength={8}
              className={inputCls}
            />
          </div>
        </div>

        {/* Campos ocultos que MP necesita */}
        <div className="hidden">
          <select id="form-checkout__issuer" />
          <select id="form-checkout__installments" />
          <input id="form-checkout__cardholderEmail" type="hidden" />
        </div>

        <button
          type="submit"
          disabled={loading || !formReady || fetching}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {(loading || fetching)
            ? <><Loader2 size={14} className="animate-spin" /> Procesando...</>
            : 'Realizar pago'}
        </button>

        <p className="text-center text-[10.5px] text-[#A8A49D]">
          Pago seguro con encriptación SSL
        </p>

        {process.env.NODE_ENV === 'development' && (
          <p className="text-center text-[10px] font-mono text-[#A8A49D] bg-[#F9F9F8] border border-[#E5E4E0] rounded-[6px] px-3 py-1.5 leading-relaxed">
            Dev — tarjeta: 5031 7557 3453 0604 · venc: 11/30 · CVV: 123
          </p>
        )}
      </form>
    </>
  )
}
