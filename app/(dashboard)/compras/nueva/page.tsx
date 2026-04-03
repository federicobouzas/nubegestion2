import { redirect } from 'next/navigation'
import { getFacturasLimitInfo } from '@/lib/plan'
import NuevaCompraClient from '@/components/compras/NuevaCompraClient'

export default async function NuevaCompraPage() {
  const { limit, total } = await getFacturasLimitInfo()
  if (limit !== null && total >= limit) {
    redirect('/suscripcion?limite=facturas')
  }
  return <NuevaCompraClient />
}
