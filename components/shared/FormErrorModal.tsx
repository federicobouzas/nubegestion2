'use client'
import { X, TriangleAlert } from 'lucide-react'
import type { FieldErrors } from '@/hooks/useFormValidation'

interface Props {
  open: boolean
  onClose: () => void
  errors?: FieldErrors
}

export default function FormErrorModal({ open, onClose, errors = {} }: Props) {
  if (!open) return null
  const lista = Object.values(errors).filter(Boolean)
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#FEE8E8] border-b border-[#FECACA] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EE3232] flex items-center justify-center flex-shrink-0">
              <TriangleAlert size={15} color="white" strokeWidth={2.2} />
            </div>
            <span className="font-display text-[14px] font-bold text-[#7F1D1D]">Formulario con errores</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-[6px] border border-[#FECACA] flex items-center justify-center text-[#7F1D1D] hover:bg-[#FEE8E8]">
            <X size={13} strokeWidth={2} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-[#3F3F46] leading-relaxed mb-3">
            Revisá los campos marcados en rojo antes de continuar.
          </p>
          {lista.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {lista.map((msg, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[#7F1D1D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EE3232] mt-1.5 flex-shrink-0" />
                  {msg}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#EE3232] text-white hover:bg-[#C62020] transition-colors">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
