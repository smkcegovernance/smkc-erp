/**
 * Client-safe token utility.
 * Calls server-side API routes to encrypt/decrypt print tokens.
 */
export interface PrintParams {
  workOrderNo: number
  deptCode: number
  finYear: string
}

export type DecodedParams = PrintParams

export async function encryptParams(params: PrintParams): Promise<string> {
  const { workOrderNo, deptCode, finYear } = params
  const url =
    `/api/gad/samaj/make-print-token?workOrderNo=${encodeURIComponent(workOrderNo)}` +
    `&deptCode=${encodeURIComponent(deptCode)}&finYear=${encodeURIComponent(finYear)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to generate print token.')
  const json = await res.json()
  if (!json.success) throw new Error(json.message ?? 'Token generation failed.')
  return json.token as string
}

export async function decryptParams(token: string): Promise<DecodedParams | null> {
  if (!token) return null
  try {
    const res = await fetch(
      `/api/gad/samaj/decode-token?t=${encodeURIComponent(token)}`,
    )
    if (!res.ok) return null
    const json = await res.json()
    if (!json.success) return null
    return {
      workOrderNo: Number(json.workOrderNo),
      deptCode: Number(json.deptCode),
      finYear: String(json.finYear),
    }
  } catch {
    return null
  }
}
