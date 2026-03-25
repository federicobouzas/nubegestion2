'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import CobrosTable from '@/components/cobros/CobrosTable'
import { getRecibosCobro } from '@/lib/cobros'
import type { ReciboCobro } from '@/types/cobros'

export default function CobrosPage() {
  const [recibos, setRecibos] = useState<ReciboCobro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRecibos(((await getRecibosCobro(search || undefined)) as ReciboCobro[]) || [])
    } finally {
      setLoading(false)
    }
  }, [search])
  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Ingresos' }, { label: 'Cobros' }]}
        actions={
          <Link
            href="/cobros/nueva"
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors"
          >
            <Plus size={13} strokeWidth={2.2} /> Nuevo Cobro
          </Link>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <div className="mb-3">
          <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Cobros</h1>
          <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{recibos.length} recibos</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F9F9F8] border border-[#E5E4E0] rounded-[9px] px-3 py-1.5 max-w-[300px]">
          <Search size={13} className="text-[#A8A49D]" />
          <input
            className="bg-transparent text-[12.5px] text-[#18181B] placeholder:text-[#A8A49D] outline-none flex-1"
            placeholder="Buscar por código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
        ) : (
          <CobrosTable recibos={recibos} />
        )}
      </div>
    </div>
  )
}
