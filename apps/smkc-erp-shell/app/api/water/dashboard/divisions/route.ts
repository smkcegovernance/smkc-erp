import { NextRequest } from 'next/server'
import { withRoute } from '@/lib/api/route'
import { apiServer } from '@smkc/api-client'

export const GET = withRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const wardCode = searchParams.get('wardCode') ?? '0'

  const data = await apiServer.get<unknown>(
    `/api/water/dashboard/divisions?wardCode=${encodeURIComponent(wardCode)}`
  )
  return data
})
