import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function GET(req: NextRequest) {
  const nastiNo = req.nextUrl.searchParams.get('nastiNo') ?? ''
  return proxySamaj(req, `api/gad/samaj/validate-nasti?nastiNo=${encodeURIComponent(nastiNo)}`)
}
