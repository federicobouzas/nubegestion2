'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import TableSkeleton from '@/components/shared/TableSkeleton'
import { getCategoriasGasto, deleteCategoriaGasto, TIPOS_CATEGORIA } from '@/lib/gastos'
import type { CategoriaGasto } from '@/types/gastos'

export default function CategoriasGastoPage() {
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  async function load() {
    setLoading(true)
    try { setCategorias((await getCategoriasGasto()) || []) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await deleteCategoriaGasto(id)
    load()
  }

  const filtered = categorias.filter(c => {
    if (filtroTipo && c.tipo !== filtroTipo) return false
    if (filtroEstado && c.estado !== filtroEstado) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Sistema' }, { label: 'Categorías de Gastos' }]}
        actions={
          <Link href="/categorias-gastos/nueva" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
            <Plus size={13} strokeWidth={2.2} /> Nueva Categoría
          </Link>
        }
      />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Categorías de Gastos</h1>
        <p className="text-[12.5px] text-[#A8A49D] mt-0.5">{filtered.length} categorías</p>
      </div>
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-2.5 flex gap-3 items-center flex-shrink-0">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los tipos</option>
          {TIPOS_CATEGORIA.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="h-7 text-[11.5px] font-medium border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#6B6762] focus:outline-none focus:border-[#F2682E]">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        {(filtroTipo || filtroEstado) && (
          <button onClick={() => { setFiltroTipo(''); setFiltroEstado('') }}
            className="text-[11px] text-[#F2682E] hover:text-[#C94E18] font-medium transition-colors">Limpiar</button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                {['Tipo','Descripción','Estado',''].map((h,i)=><th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody><TableSkeleton cols={['badge','medium','badge','actions']} /></tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
            No hay categorías. <Link href="/categorias-gastos/nueva" className="text-[#F2682E] font-semibold hover:underline">Crear la primera</Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Tipo','Descripción','Estado',''].map((h,i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold bg-[#F1F0EE] text-[#6B6762] px-2 py-0.5 rounded-full">{c.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-[#18181B]">{c.descripcion}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.estado === 'activo' ? 'bg-[#E8F7EF] text-[#1A5C38]' : 'bg-[#F1F0EE] text-[#6B6762]'}`}>
                        {c.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Link href={`/categorias-gastos/${c.id}/editar`} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
                          <Pencil size={13} strokeWidth={2} />
                        </Link>
                        <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#EE3232] hover:text-[#EE3232] transition-colors">
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
