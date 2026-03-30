'use client'
import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Save, X } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import FieldWrapper, { inputCls } from '@/components/shared/FieldWrapper'
import { getListasPrecios, getProductosConPrecios, actualizarPreciosMasivo } from '@/lib/listas-precios'
import type { ListaPrecio } from '@/types/listas-precios'

export default function ActualizarPreciosPage() {
  const [listas, setListas] = useState<ListaPrecio[]>([])
  const [listaId, setListaId] = useState('')
  const [omitir, setOmitir] = useState<'si' | 'no'>('si')
  const [file, setFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ updated: number; notFound: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getListasPrecios().then(d => setListas(d || []))
  }, [])

  async function handleDescargar() {
    if (!listaId) { setError('Seleccioná una lista antes de descargar.'); return }
    setError('')
    setDownloading(true)
    try {
      const XLSX = await import('xlsx')
      const productos = await getProductosConPrecios(listaId)
      const lista = listas.find(l => l.id === listaId)
      const rows = [
        ['Nombre', 'Precio'],
        ...productos.map(p => [p.nombre, p.precio ?? '']),
      ]
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws['!cols'] = [{ wch: 40 }, { wch: 15 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Precios')
      XLSX.writeFile(wb, `precios-${lista?.nombre || 'lista'}.xlsx`)
    } catch (err: any) {
      setError(err?.message || 'Error al generar el archivo.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!listaId) { setError('Seleccioná una lista de precios.'); return }
    if (!file) { setError('Seleccioná un archivo Excel para importar.'); return }

    setSaving(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      const data = omitir === 'si' ? rows.slice(1) : rows

      const updates = data
        .filter(row => row[0] && row[1] !== '')
        .map(row => ({
          nombre: String(row[0]).trim(),
          precio: parseFloat(String(row[1]).replace(',', '.')),
        }))
        .filter(r => !isNaN(r.precio))

      if (updates.length === 0) { setError('No se encontraron filas válidas en el archivo.'); setSaving(false); return }

      const res = await actualizarPreciosMasivo(listaId, updates)
      setResult(res)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el archivo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Listas de Precios', href: '/listas-precios' }, { label: 'Actualización Masiva' }]} />
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <h1 className="font-display text-[20px] font-extrabold tracking-tight">Actualización Masiva de Precios</h1>
        <p className="text-[12.5px] text-[#A8A49D] mt-0.5">Descargá el listado, editá los precios en Excel y volvé a subirlo.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Paso 1: seleccionar lista */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F2682E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
            <span className="font-display text-[13.5px] font-bold">Seleccioná la lista de precios</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <FieldWrapper label="Lista de precios" required>
              <select
                className={inputCls()}
                value={listaId}
                onChange={e => { setListaId(e.target.value); setResult(null); setError('') }}
              >
                <option value="">Seleccionar lista...</option>
                {listas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </FieldWrapper>
          </div>
        </div>

        {/* Paso 2: descargar */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F2682E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
            <span className="font-display text-[13.5px] font-bold">Descargá el listado actual</span>
          </div>
          <div className="p-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDescargar}
              disabled={downloading || !listaId}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-white text-[#2B445A] hover:border-[#2B445A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={13} strokeWidth={2.2} />
              {downloading ? 'Generando...' : 'Descargar Listado (.xlsx)'}
            </button>
            <p className="text-[12px] text-[#A8A49D]">
              Genera un Excel con todos los productos activos y sus precios actuales para la lista seleccionada.
            </p>
          </div>
        </div>

        {/* Paso 3: subir */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F2682E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
            <span className="font-display text-[13.5px] font-bold">Subí el archivo con los precios actualizados</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <FieldWrapper label="Omitir primera fila (encabezado)">
              <select
                className={inputCls()}
                value={omitir}
                onChange={e => setOmitir(e.target.value as 'si' | 'no')}
              >
                <option value="si">Sí — la primera fila es el encabezado</option>
                <option value="no">No — la primera fila ya es un producto</option>
              </select>
            </FieldWrapper>
            <FieldWrapper label="Archivo Excel (.xlsx)">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError('') }}
                className="bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] text-[#18181B] w-full file:mr-3 file:py-0.5 file:px-2.5 file:rounded-[6px] file:border-0 file:text-[11.5px] file:font-semibold file:bg-[#F1F0EE] file:text-[#6B6762] hover:file:bg-[#E5E4E0] cursor-pointer"
              />
            </FieldWrapper>
            {file && (
              <div className="col-span-2 flex items-center gap-2 text-[12px] text-[#6B6762]">
                <Upload size={12} strokeWidth={2} />
                <span className="font-medium">{file.name}</span>
                <span className="text-[#A8A49D]">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-[#FEE8E8] border border-[#FECACA] rounded-xl px-4 py-3 text-[13px] font-semibold text-[#7F1D1D]">
            <X size={14} strokeWidth={2.5} /> {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="flex items-center gap-3 bg-[#E8F7EF] border border-[#B7E8CE] rounded-xl px-4 py-3">
            <span className="w-6 h-6 rounded-full bg-[#4EBB7F] flex items-center justify-center flex-shrink-0">
              <Save size={11} color="white" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#1A5C38]">
                Precios actualizados correctamente.
              </p>
              <p className="text-[12px] text-[#2E7D4F] mt-0.5">
                {result.updated} {result.updated === 1 ? 'producto actualizado' : 'productos actualizados'}
                {result.notFound > 0 && ` · ${result.notFound} ${result.notFound === 1 ? 'producto no encontrado' : 'productos no encontrados'} (nombre no coincide)`}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="submit"
            disabled={saving || !listaId || !file}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={13} strokeWidth={2.2} />
            {saving ? 'Procesando...' : 'Importar precios'}
          </button>
        </div>
      </form>
    </div>
  )
}
