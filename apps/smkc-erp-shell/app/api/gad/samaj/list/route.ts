import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const finYear = searchParams.get('finYear') ?? ''
  const userId  = searchParams.get('userId')  ?? ''
  const qs = `finYear=${encodeURIComponent(finYear)}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`
  return proxySamaj(req, `api/gad/samaj/list?${qs}`)
}
