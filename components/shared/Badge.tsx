type BadgeVariant = 'success' | 'warning' | 'danger' | 'cyan' | 'navy' | 'orange' | 'gray'
const variants: Record<BadgeVariant, string> = {
  success: 'bg-[#E8F7EF] text-[#1A5C38]', warning: 'bg-[#FEF8E1] text-[#7A5500]',
  danger: 'bg-[#FEE8E8] text-[#7F1D1D]', cyan: 'bg-[#E6F7FE] text-[#1A9BD4]',
  navy: 'bg-[#E8EEF3] text-[#2B445A]', orange: 'bg-[#FEF0EA] text-[#C94E18]', gray: 'bg-[#F1F0EE] text-[#6B6762]',
}
const dots: Record<BadgeVariant, string> = {
  success: 'bg-[#4EBB7F]', warning: 'bg-[#FDBC16]', danger: 'bg-[#EE3232]',
  cyan: 'bg-[#2CBAF2]', navy: 'bg-[#2B445A]', orange: 'bg-[#F2682E]', gray: 'bg-[#A8A49D]',
}
export default function Badge({ variant, label, dot = true }: { variant: BadgeVariant; label: string; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dots[variant]}`} />}
      {label}
    </span>
  )
}
