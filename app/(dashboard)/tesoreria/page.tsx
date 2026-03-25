'use client'
import Topbar from '@/components/shared/Topbar'
export default function Page() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Tesoreria' }]} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
          Módulo <strong>Tesoreria</strong> en construcción.
        </div>
      </div>
    </div>
  )
}
