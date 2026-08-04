import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function POST(req: NextRequest) {
  return proxySamaj(req, 'api/gad/samaj/generate', 'POST')
}
