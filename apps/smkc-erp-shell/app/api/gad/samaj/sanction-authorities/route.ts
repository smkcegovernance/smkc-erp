import { NextRequest } from 'next/server'
import { proxySamaj } from '../proxy'

export async function GET(req: NextRequest) {
  return proxySamaj(req, 'api/gad/samaj/sanction-authorities')
}
