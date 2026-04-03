'use client'
import { useEffect, useState } from 'react'
import type { PlanInfo } from '@/lib/plan'

const DEFAULT: PlanInfo = {
  plan: 'free',
  planNombre: 'Gratuito',
  planEndsAt: null,
  isActive: true,
  diasVencido: 0,
  inGracePeriod: false,
  isBlocked: false,
}

export function usePlan() {
  const [info, setInfo] = useState<PlanInfo>(DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plan')
      .then(r => r.json())
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { ...info, loading }
}