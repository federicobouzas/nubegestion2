import { NextResponse } from 'next/server'
import { getPlanInfo } from '@/lib/plan'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info = await getPlanInfo()
  return NextResponse.json(info)
}
