import { NextRequest } from 'next/server'
import { withRoute } from '@/lib/api/route'
import { registrations, type RegistrationRecord } from './store'
import type { PaginatedResponse } from '@smkc/types'

function generateRegistrationNumber(): string {
  const prefix = 'SMKC-PWD'
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}-${random}`
}

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

export const POST = withRoute(async (req: NextRequest) => {
  const formData = await req.formData()
  const data = parseMultipartRecord(formData)
  const registrationNumber = generateRegistrationNumber()
  registrations.set(registrationNumber, {
    ...data,
    registrationNumber,
    registrationDate: new Date().toISOString(),
    status: 'pending',
  })
  return { registrationNumber, message: 'नोंदणी यशस्वी!' }
}, { requireAuth: true })

export const GET = withRoute(async (req: NextRequest): Promise<PaginatedResponse<RegistrationRecord>> => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
  const all = Array.from(registrations.values())
  const start = (page - 1) * pageSize
  return {
    items: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
  }
}, { requireAuth: true })