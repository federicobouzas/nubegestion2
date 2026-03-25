interface Props {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export default function FieldWrapper({ label, required, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">
        {label}{required && <span className="text-[#F2682E] ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-[#EE3232] font-medium">{error}</span>}
    </div>
  )
}

export const inputCls = (error?: string) =>
  `bg-white border rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:ring-2 transition-colors placeholder:text-[#A8A49D] placeholder:font-normal w-full ${
    error
      ? 'border-[#EE3232] focus:border-[#EE3232] focus:ring-[#EE3232]/10'
      : 'border-[#E5E4E0] focus:border-[#F2682E] focus:ring-[#F2682E]/10'
  }`

export const inputSmCls = (error?: string) =>
  `bg-white border rounded-[7px] px-2.5 py-1.5 text-[12.5px] text-[#18181B] focus:outline-none focus:border-[#F2682E] transition-colors w-full ${
    error ? 'border-[#EE3232]' : 'border-[#E5E4E0]'
  }`
