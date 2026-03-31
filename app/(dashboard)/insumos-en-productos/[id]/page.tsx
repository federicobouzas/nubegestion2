'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, Save } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import ProductoAutocomplete from '@/components/shared/ProductoAutocomplete'
import { getRecetaProducto, addInsumoAProducto, updateInsumoEnProducto, removeInsumoDeProducto, getInsumos } from '@/lib/produccion'
import { getProducto } from '@/lib/productos'
import { formatMonto } from '@/lib/gastos'
import { inputSmCls } from '@/components/shared/FieldWrapper'
import type { Insumo } from '@/types/produccion'
import type { ItemCatalogo } from '@/types/servicios'

interface FilaReceta {
  id?: string          // undefined = fila nueva sin guardar
  insumo_id: string
  label: string
  unidad_medida: string
  precio_compra: number
  cantidad: number
}

const emptyFila = (): FilaReceta => ({
  insumo_id: '', label: '', unidad_medida: '', precio_compra: 0, cantidad: 1,
})

export default function RecetaProductoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [producto, setProducto] = useState<any>(null)
  const [filas, setFilas] = useState<FilaReceta[]>([])
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getProducto(id),
      getRecetaProducto(id),
      getInsumos({ estado: 'activo' }),
    ]).then(([prod, rec, ins]) => {
      setProducto(prod)
      setFilas((rec || []).map((r: any) => ({
        id: r.id,
        insumo_id: r.insumo_id,
        label: r.insumos_produccion?.nombre ?? '',
        unidad_medida: r.insumos_produccion?.unidad_medida ?? '',
        precio_compra: Number(r.insumos_produccion?.precio_compra ?? 0),
        cantidad: Number(r.cantidad),
      })))
      setCatalogo((ins || []).map((i: Insumo) => ({
        id: i.id,
        tipo: 'producto' as const,
        nombre: i.nombre,
        codigo: null,
        iva: Number(i.iva),
        stock_actual: Number(i.stock),
        unidad_medida: i.unidad_medida,
        precio_venta: Number(i.precio_compra),
      })))
    }).finally(() => setLoading(false))
  }, [id])

  function addFila() {
    setFilas(f => [...f, emptyFila()])
  }

  function removeFila(idx: number) {
    setFilas(f => f.filter((_, i) => i !== idx))
  }

  function selectInsumo(idx: number, item: ItemCatalogo | null) {
    setFilas(f => {
      const next = [...f]
      next[idx] = {
        ...next[idx],
        insumo_id: item?.id ?? '',
        label: item?.nombre ?? '',
        unidad_medida: item?.unidad_medida ?? '',
        precio_compra: item?.precio_venta ?? 0,
      }
      return next
    })
  }

  function setCantidad(idx: number, v: number) {
    setFilas(f => {
      const next = [...f]
      next[idx] = { ...next[idx], cantidad: v }
      return next
    })
  }

  // Insumos ya usados para excluirlos del autocomplete de cada fila
  function catalogoDisponible(idx: number) {
    const usados = filas.filter((_, i) => i !== idx).map(f => f.insumo_id)
    return catalogo.filter(c => !usados.includes(c.id))
  }

  async function handleGuardar() {
    setError('')
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i]
      if (!f.insumo_id) { setError(`Fila ${i + 1}: seleccioná un insumo.`); return }
      if (!f.cantidad || f.cantidad <= 0) { setError(`Fila ${i + 1}: la cantidad debe ser mayor a 0.`); return }
    }

    setSaving(true)
    try {
      // Obtener receta actual para saber qué borrar
      const recetaActual = await getRecetaProducto(id) as any[]
      const idsActuales = new Set((recetaActual || []).map((r: any) => r.id))
      const idsNuevos = new Set(filas.filter(f => f.id).map(f => f.id!))

      // Borrar los que ya no están
      for (const r of (recetaActual || [])) {
        if (!idsNuevos.has(r.id)) await removeInsumoDeProducto(r.id)
      }

      // Insertar nuevos o actualizar existentes
      for (const f of filas) {
        if (f.id) {
          await updateInsumoEnProducto(f.id, f.cantidad)
        } else {
          await addInsumoAProducto(id, f.insumo_id, f.cantidad)
        }
      }

      // Recargar para tener los ids correctos
      const rec = await getRecetaProducto(id)
      setFilas((rec || []).map((r: any) => ({
        id: r.id,
        insumo_id: r.insumo_id,
        label: r.insumos_produccion?.nombre ?? '',
        unidad_medida: r.insumos_produccion?.unidad_medida ?? '',
        precio_compra: Number(r.insumos_produccion?.precio_compra ?? 0),
        cantidad: Number(r.cantidad),
      })))
      router.back()
    } catch (err: any) {
      setError(err?.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const costoTotal = filas.reduce((acc, f) => acc + f.precio_compra * f.cantidad, 0)

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Producción' }, { label: 'Insumos en Productos', href: '/insumos-en-productos' }, { label: '...' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[
        { label: 'Producción' },
        { label: 'Insumos en Productos', href: '/insumos-en-productos' },
        { label: producto?.nombre || '...' },
      ]} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* Info del producto */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-0.5">Producto</div>
              <div className="text-[15px] font-bold text-[#18181B]">{producto?.nombre}</div>
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-0.5">Stock actual</div>
              <div className="font-mono text-[14px] font-bold text-[#18181B]">
                {Number(producto?.stock_actual ?? 0).toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        {/* Receta */}
        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
            <span className="font-display text-[13.5px] font-bold">Insumos para Producción</span>
            <span className="font-mono text-[11px] text-[#6B6762]">
              Costo total: <strong className="text-[#18181B]">{formatMonto(costoTotal)}</strong>
            </span>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                {['Insumo', 'Unidad', 'Precio Compra/u', 'Cantidad', 'Costo', ''].map((h, i) => (
                  <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">
                    Sin insumos. Usá "Agregar insumo" para empezar.
                  </td>
                </tr>
              )}
              {filas.map((fila, idx) => (
                <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                  <td className="px-3 py-2 min-w-[220px] align-top">
                    {fila.id ? (
                      // Ya guardado: mostrar nombre (no se puede cambiar el insumo)
                      <span className="text-[12px] text-[#18181B] font-medium block pt-1.5">{fila.label}</span>
                    ) : (
                      <ProductoAutocomplete
                        items={catalogoDisponible(idx)}
                        value={fila.insumo_id}
                        label={fila.label}
                        onSelect={item => selectInsumo(idx, item)}
                        placeholder="Buscar insumo..."
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-[#6B6762] align-top pt-3">
                    {fila.unidad_medida || '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px] text-[#6B6762] align-top pt-3">
                    {formatMonto(fila.precio_compra)}
                  </td>
                  <td className="px-3 py-2 w-[100px] align-top">
                    <input
                      className={inputSmCls()}
                      type="number"
                      min={0.001}
                      step={0.001}
                      value={fila.cantidad}
                      onChange={e => setCantidad(idx, parseFloat(e.target.value) || 1)}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px] font-bold text-[#18181B] align-top pt-3">
                    {formatMonto(fila.precio_compra * fila.cantidad)}
                  </td>
                  <td className="px-3 py-2 align-top pt-2">
                    <button
                      type="button"
                      onClick={() => removeFila(idx)}
                      className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"
                    >
                      <Trash2 size={11} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-[#F1F0EE]">
            <button
              type="button"
              onClick={addFila}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors"
            >
              <Plus size={13} strokeWidth={2.2} /> Agregar insumo
            </button>
          </div>
        </div>

        {error && (
          <div className="text-[12px] text-[#EE3232] font-medium text-right">{error}</div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
          >
            <Save size={13} strokeWidth={2.2} /> {saving ? 'Guardando...' : 'Guardar receta'}
          </button>
        </div>
      </div>
    </div>
  )
}
