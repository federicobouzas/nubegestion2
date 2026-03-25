'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getReciboCobro, getMetodosCobro, getFacturasCobro, getRetencionesCobro, formatMonto } from '@/lib/cobros'

export default function ImprimirCobroPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [r, setR] = useState<{
    codigo: string
    numero: string | null
    fecha: string
    total: number
    clientes?: { nombre_razon_social: string; cuit: string | null }
  } | null>(null)
  const [metodos, setMetodos] = useState<{ monto: number; cuentas?: { nombre: string } | null }[]>([])
  const [facturas, setFacturas] = useState<
    { importe: number; facturas_venta?: { numero: string | null; codigo: string; total: number } | null }[]
  >([])
  const [retenciones, setRetenciones] = useState<
    { impuesto: string; numero_comprobante: string | null; fecha: string | null; importe: number }[]
  >([])

  useEffect(() => {
    if (!id) return
    Promise.all([getReciboCobro(id), getMetodosCobro(id), getFacturasCobro(id), getRetencionesCobro(id)]).then(
      ([rc, m, f, ret]) => {
        setR(rc)
        setMetodos(m || [])
        setFacturas(f || [])
        setRetenciones(ret || [])
      }
    )
  }, [id])

  useEffect(() => {
    if (r) setTimeout(() => window.print(), 400)
  }, [r])

  if (!r) return <div style={{ padding: 32, textAlign: 'center', color: '#999' }}>Cargando...</div>

  const totalRetenciones = retenciones.reduce((a, ret) => a + Number(ret.importe), 0)

  return (
    <>
      <style>{`
        @page { size: A4; margin: 15mm; }
        @media print { body { margin: 0; } }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
      `}</style>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            borderBottom: '2px solid #F2682E',
            paddingBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F2682E' }}>RECIBO DE COBRO</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Código: <strong>{r.codigo}</strong>
              {r.numero ? ` · N° ${r.numero}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Fecha</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(r.fecha).toLocaleDateString('es-AR')}</div>
          </div>
        </div>

        <div
          style={{
            background: '#F9F9F8',
            border: '1px solid #E5E4E0',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              color: '#999',
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Cliente
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{r.clientes?.nombre_razon_social}</div>
          {r.clientes?.cuit && <div style={{ fontSize: 11, color: '#555' }}>CUIT: {r.clientes.cuit}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Facturas saldadas
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9F9F8', borderBottom: '1px solid #E5E4E0' }}>
                {['Factura', 'Total factura', 'Importe abonado'].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      fontSize: 9,
                      textTransform: 'uppercase',
                      color: '#999',
                      padding: '6px 8px',
                      textAlign: 'left',
                      letterSpacing: 0.5,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturas.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F0EE' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {f.facturas_venta?.numero || f.facturas_venta?.codigo || '—'}
                  </td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>
                    {f.facturas_venta ? formatMonto(f.facturas_venta.total) : '—'}
                  </td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>
                    {formatMonto(f.importe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Métodos de cobro
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9F9F8', borderBottom: '1px solid #E5E4E0' }}>
                {['Cuenta', 'Monto'].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      fontSize: 9,
                      textTransform: 'uppercase',
                      color: '#999',
                      padding: '6px 8px',
                      textAlign: 'left',
                      letterSpacing: 0.5,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metodos.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F0EE' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{m.cuentas?.nombre || '—'}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{formatMonto(m.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {retenciones.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Retenciones
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9F9F8', borderBottom: '1px solid #E5E4E0' }}>
                  {['Impuesto', 'N° Comprobante', 'Fecha', 'Importe'].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        fontSize: 9,
                        textTransform: 'uppercase',
                        color: '#999',
                        padding: '6px 8px',
                        textAlign: 'left',
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retenciones.map((ret, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F0EE' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{ret.impuesto}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{ret.numero_comprobante || '—'}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>
                      {ret.fecha ? new Date(ret.fecha).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {formatMonto(ret.importe)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ borderTop: '2px solid #F2682E', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            {totalRetenciones > 0 && (
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                Retenciones:{' '}
                <strong style={{ fontFamily: 'monospace' }}>{formatMonto(totalRetenciones)}</strong>
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F2682E' }}>
              Total cobrado: <span style={{ fontFamily: 'monospace' }}>{formatMonto(r.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
