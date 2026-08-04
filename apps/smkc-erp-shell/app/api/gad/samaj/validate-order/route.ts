import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function GET(req: NextRequest) {
  const finalOrderNo = req.nextUrl.searchParams.get('finalOrderNo') ?? ''
  return proxySamaj(req, `api/gad/samaj/validate-order?finalOrderNo=${encodeURIComponent(finalOrderNo)}`)
}
