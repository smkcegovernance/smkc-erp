import { NextRequest, NextResponse } from 'next/server'
import { registrations, type RegistrationRecord } from './store'

function generateRegistrationNumber(): string {
  const prefix = 'SMKC-PWD'
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')
  return `${prefix}-${year}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data: RegistrationRecord = {}

    formData.forEach((value, key) => {
      if (value instanceof File) {
        data[key] = {
          name: value.name,
          type: value.type,
          size: value.size,
        }
      } else {
        try {
          data[key] = JSON.parse(value)
        } catch {
          data[key] = value
        }
      }
    })

    const registrationNumber = generateRegistrationNumber()
    registrations.set(registrationNumber, {
      ...data,
      registrationNumber,
      registrationDate: new Date().toISOString(),
      status: 'pending',
    })

    return NextResponse.json({
      success: true,
      message: 'नोंदणी यशस्वी!',
      registrationNumber,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'नोंदणी करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const allRegistrations = Array.from(registrations.values())
    const start = (page - 1) * limit
    const paginatedData = allRegistrations.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: allRegistrations.length,
        totalPages: Math.ceil(allRegistrations.length / limit),
      },
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'डेटा लोड करताना त्रुटी आली.',
      },
      { status: 500 }
    )
  }
}