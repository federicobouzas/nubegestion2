import Link from 'next/link'
import { ChevronRight, Bell, CircleHelp } from 'lucide-react'
interface BreadcrumbItem { label: string; href?: string }
interface TopbarProps { breadcrumb: BreadcrumbItem[]; actions?: React.ReactNode }
export default function Topbar({ breadcrumb, actions }: TopbarProps) {
  return (
    <div className="bg-white border-b border-[#E5E4E0] px-6 h-[52px] flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-1.5">
        {breadcrumb.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} className="text-[#D0CEC9]" />}
            {item.href
              ? <Link href={item.href} className="text-[13px] text-[#A8A49D] hover:text-[#18181B] transition-colors">{item.label}</Link>
              : <span className="text-[13px] font-semibold text-[#18181B]">{item.label}</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button className="w-8 h-8 rounded-[9px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><Bell size={14} strokeWidth={2} /></button>
        <button className="w-8 h-8 rounded-[9px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"><CircleHelp size={14} strokeWidth={2} /></button>
      </div>
    </div>
  )
}
