import { redirect } from 'next/navigation'
import { getFacturasLimitInfo } from '@/lib/plan'
import NuevaVentaClient from '@/components/ventas/NuevaVentaClient'

export default async function NuevaVentaPage() {
  const { limit, total } = await getFacturasLimitInfo()
  if (limit !== null && total >= limit) {
    redirect('/suscripcion?limite=facturas')
  }
  return <NuevaVentaClient />
}
