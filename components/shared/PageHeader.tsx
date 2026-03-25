interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  filters?: React.ReactNode
}

export default function PageHeader({ title, subtitle, actions, filters }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">{title}</h1>
          {subtitle && <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {filters && <div className="flex items-center gap-2">{filters}</div>}
    </div>
  )
}
