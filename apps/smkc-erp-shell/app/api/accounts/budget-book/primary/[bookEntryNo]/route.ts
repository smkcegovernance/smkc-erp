import { proxyBudgetBookRequest } from '../../proxy'

export async function GET(_req: Request, { params }: { params: Promise<{ bookEntryNo: string }> }) {
  const { bookEntryNo } = await params
  return proxyBudgetBookRequest('GET', `/primary/${bookEntryNo}`)
}
