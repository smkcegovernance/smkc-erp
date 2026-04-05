import { NextRequest } from 'next/server'
import { SmkcApiError } from '@smkc/types'
import { withRoute } from '@/lib/api/route'
import { registrations, type RegistrationRecord } from '../store'

function parseMultipartRecord(formData: FormData): RegistrationRecord {
  const data: RegistrationRecord = {}
  formData.forEach((value, key) => {
    if (value instanceof File) {
      data[key] = { name: value.name, type: value.type, size: value.size }
    } else {
      try { data[key] = JSON.parse(value) } catch { data[key] = value }
    }
  })
  return data
}

export const GET = withRoute(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params
  const registration = registrations.get(id)
  if (!registration) throw new SmkcApiError('नोंदणी आढळली नाही.', 404, 'NOT_FOUND')
  return registration
}, { requireAuth: true })

export const PUT = withRoute(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params
  const existing = registrations.get(id)
  if (!existing) throw new SmkcApiError('नोंदणी आढळली नाही.', 404, 'NOT_FOUND')
  const formData = await req.formData()
  const updated = { ...existing, ...parseMultipartRecord(formData), updatedDate: new Date().toISOString() }
  registrations.set(id, updated)
  return updated
}, { requireAuth: true })

export const DELETE = withRoute(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params
  if (!registrations.has(id)) throw new SmkcApiError('नोंदणी आढळली नाही.', 404, 'NOT_FOUND')
  registrations.delete(id)
  return { message: 'नोंदणी हटवली!' }
}, { requireAuth: true })