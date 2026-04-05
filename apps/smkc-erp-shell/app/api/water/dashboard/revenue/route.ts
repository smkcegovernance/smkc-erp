import { NextRequest } from 'next/server'
import { withRoute } from '@/lib/api/route'
import { apiServer } from '@smkc/api-client'
import type { WaterRevenueDashboard } from '@smkc/types'

export const GET = withRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const finyr    = searchParams.get('finyr')    ?? '2026-2027'
  const wardCode = searchParams.get('wardCode') ?? '0'
  const divCode  = searchParams.get('divCode')  ?? '0'

  const data = await apiServer.get<WaterRevenueDashboard>(
    `/api/water/dashboard/revenue?finyr=${encodeURIComponent(finyr)}&wardCode=${encodeURIComponent(wardCode)}&divCode=${encodeURIComponent(divCode)}`
  )
  return data
})
