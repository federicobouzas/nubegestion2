'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getFacturaVenta, getItemsFacturaVenta, getPercepcionesFacturaVenta, formatMonto } from '@/lib/ventas'
import type { FacturaVenta, ItemFacturaVenta, PercepcionFactura } from '@/types/ventas'

export default function ImprimirPage() {
  const { id } = useParams<{ id: string }>()
  const [f, setF] = useState<FacturaVenta | null>(null)
  const [items, setItems] = useState<ItemFacturaVenta[]>([])
  const [percepciones, setPercepciones] = useState<PercepcionFactura[]>([])

  useEffect(() => {
    Promise.all([getFacturaVenta(id), getItemsFacturaVenta(id), getPercepcionesFacturaVenta(id)])
      .then(([fv, it, pe]) => { setF(fv); setItems(it || []); setPercepciones(pe || []) })
      .catch(console.error)
  }, [id])

  useEffect(() => { if (f) setTimeout(() => window.print(), 500) }, [f])

  if (!f) return <div className="p-8 text-center text-gray-400">Cargando...</div>

  const copias = ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO']

  const ivaGroups: Record<number, number> = {}
  items.forEach(it => {
    const iva = it.iva_porcentaje
    ivaGroups[iva] = (ivaGroups[iva] || 0) + it.subtotal * (iva / 100)
  })

  return (
    <>
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print { body { margin: 0; } .page-break { page-break-after: always; } }
        body { font-family: Arial, sans-serif; font-size: 10px; }
      `}</style>
      {copias.map((copia, ci) => (
        <div key={ci} className={ci < 2 ? 'page-break' : ''} style={{ padding: '8mm', border: '1px solid #999', marginBottom: ci < 2 ? 0 : undefined }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ flex: 1, borderRight: '1px solid #999', paddingRight: 8 }}>
              <div style={{ fontSize: 9, color: '#555' }}>Razón Social:</div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>Domicilio Comercial:</div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>Condición frente al IVA:</div>
            </div>
            <div style={{ width: 80, border: '2px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 8px' }}>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>{f.tipo}</div>
              <div style={{ fontSize: 8 }}>COD. 01</div>
              <div style={{ fontSize: 7, marginTop: 4, textAlign: 'center' }}>{copia}</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #999', paddingLeft: 8 }}>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>FACTURA</div>
              <div style={{ fontSize: 9, marginTop: 4 }}>Punto de Venta: {f.numero ? f.numero.split('-')[0] : '0001'} &nbsp; Comp. Nro: {f.numero ? f.numero.split('-')[1] : '00000001'}</div>
              <div style={{ fontSize: 9, marginTop: 2 }}>Fecha de Emisión: {new Date(f.fecha_emision).toLocaleDateString('es-AR')}</div>
              {f.cae && <div style={{ fontSize: 9, marginTop: 2 }}>CAE N°: {f.cae}</div>}
              {f.cae_fecha_vencimiento && <div style={{ fontSize: 9, marginTop: 2 }}>Fecha Vto. CAE: {new Date(f.cae_fecha_vencimiento).toLocaleDateString('es-AR')}</div>}
            </div>
          </div>

          {/* Receptor */}
          <div style={{ border: '1px solid #999', padding: 6, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div><span style={{ fontSize: 8, color: '#555' }}>CUIT:</span> <span style={{ fontWeight: 'bold' }}>{f.clientes?.cuit || ''}</span></div>
              <div><span style={{ fontSize: 8, color: '#555' }}>Apellido y Nombre / Razón Social:</span> <span style={{ fontWeight: 'bold' }}>{f.clientes?.nombre_razon_social}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <div><span style={{ fontSize: 8, color: '#555' }}>Condición frente al IVA:</span> <span>{f.clientes?.condicion_iva}</span></div>
              <div><span style={{ fontSize: 8, color: '#555' }}>Condición de venta:</span> <span>{f.condicion_venta}</span></div>
            </div>
          </div>

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #999', background: '#f5f5f5' }}>
                {['Código','Producto / Servicio','Cantidad','U. medida','Precio Unit.','% Bonif','Subtotal','Alícuota IVA','Subtotal c/IVA'].map((h,i) => (
                  <th key={i} style={{ fontSize: 8, padding: '3px 4px', textAlign: 'left', fontWeight: 'bold' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}></td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{it.descripcion}</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{it.cantidad}</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>unidades</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{it.precio_unitario.toFixed(2)}</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{it.descuento_porcentaje.toFixed(2)}</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{it.subtotal.toFixed(2)}</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{it.iva_porcentaje}%</td>
                  <td style={{ fontSize: 8.5, padding: '3px 4px' }}>{(it.subtotal * (1 + it.iva_porcentaje / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Otros Tributos */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #999', background: '#f5f5f5' }}>
                <th colSpan={3} style={{ fontSize: 8, padding: '3px 4px', textAlign: 'left' }}>Otros Tributos</th>
              </tr>
              <tr>
                <th style={{ fontSize: 8, padding: '2px 4px', textAlign: 'left' }}>Descripción</th>
                <th style={{ fontSize: 8, padding: '2px 4px', textAlign: 'left' }}>Detalle</th>
                <th style={{ fontSize: 8, padding: '2px 4px', textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {['Pr./Ret. de Impuesto a las Ganancias','Pr./Ret. de IVA','Pr./Ret. Ingresos Brutos','Impuestos Internos','Impuestos Municipales'].map((t, i) => {
                const p = percepciones.find(p => p.tipo.toLowerCase().includes(t.toLowerCase().split(' ')[2] || ''))
                return (
                  <tr key={i}>
                    <td style={{ fontSize: 8.5, padding: '2px 4px' }}>{t}</td>
                    <td style={{ fontSize: 8.5, padding: '2px 4px' }}></td>
                    <td style={{ fontSize: 8.5, padding: '2px 4px', textAlign: 'right' }}>{p ? p.importe.toFixed(2) : '0,00'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginBottom: 2 }}><span>Importe Neto Gravado:</span><span>$ {f.subtotal.toFixed(2)}</span></div>
              {[27, 21, 10.5, 5, 2.5, 0].map(rate => (
                <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginBottom: 2 }}>
                  <span>IVA {rate}%:</span><span>$ {(ivaGroups[rate] || 0).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, marginBottom: 2 }}><span>Importe Otros Tributos:</span><span>$ {f.percepciones.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 10, borderTop: '1px solid #999', paddingTop: 4, marginTop: 4 }}><span>Importe Total:</span><span>$ {f.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
