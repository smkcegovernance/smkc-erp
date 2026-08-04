/**
 * Server-side only — AES-256-GCM print token utility.
 * Token format (base64url): IV[12] | AuthTag[16] | Ciphertext
 * Plain payload: "workOrderNo|deptCode|finYear"
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer {
  const secret =
    process.env.SAMAJ_PRINT_SECRET ?? 'smkc-samaj-dev-fallback-secret-key!!!'
  return createHash('sha256').update(secret, 'utf8').digest()
}

export function encryptPrintToken(
  workOrderNo: number,
  deptCode: number,
  finYear: string,
): string {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const plain = `${workOrderNo}|${deptCode}|${finYear}`
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64url')
}

export interface PrintTokenData {
  workOrderNo: number
  deptCode: number
  finYear: string
}

export function decryptPrintToken(token: string): PrintTokenData {
  const key = getKey()
  const buf = Buffer.from(token, 'base64url')
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Invalid token length')
  }
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = buf.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const plain =
    decipher.update(enc).toString('utf8') + decipher.final('utf8')
  const parts = plain.split('|')
  if (parts.length < 3) {
    throw new Error('Malformed token payload')
  }
  return {
    workOrderNo: Number(parts[0]),
    deptCode: Number(parts[1]),
    finYear: parts.slice(2).join('|'), // safe if finYear ever contains |
  }
}
