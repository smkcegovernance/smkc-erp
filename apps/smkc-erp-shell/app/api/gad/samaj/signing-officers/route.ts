import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function GET(req: NextRequest) {
  const deptCode = req.nextUrl.searchParams.get('deptCode') ?? ''
  return proxySamaj(req, `api/gad/samaj/signing-officers?deptCode=${encodeURIComponent(deptCode)}`)
}
