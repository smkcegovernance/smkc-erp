import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function GET(req: NextRequest) {
  const deptCode = req.nextUrl.searchParams.get('deptCode') ?? ''
  const finYear  = req.nextUrl.searchParams.get('finYear')  ?? ''
  return proxySamaj(
    req,
    `api/gad/samaj/next-number?deptCode=${encodeURIComponent(deptCode)}&finYear=${encodeURIComponent(finYear)}`
  )
}
