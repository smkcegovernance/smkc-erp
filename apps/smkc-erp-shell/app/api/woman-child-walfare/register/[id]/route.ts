import { NextRequest, NextResponse } from 'next/server'
import { registrations, type RegistrationRecord } from '../store'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const registration = registrations.get(id)

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message: 'नोंदणी आढळली नाही.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: registration,
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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const existingRegistration = registrations.get(id)

    if (!existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message: 'नोंदणी आढळली नाही.',
        },
        { status: 404 }
      )
    }

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

    const updatedRegistration = {
      ...existingRegistration,
      ...data,
      updatedDate: new Date().toISOString(),
    }
    registrations.set(id, updatedRegistration)

    return NextResponse.json({
      success: true,
      message: 'नोंदणी अपडेट झाली!',
      data: updatedRegistration,
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'अपडेट करताना त्रुटी आली.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!registrations.has(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'नोंदणी आढळली नाही.',
        },
        { status: 404 }
      )
    }

    registrations.delete(id)

    return NextResponse.json({
      success: true,
      message: 'नोंदणी हटवली!',
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'हटवताना त्रुटी आली.',
      },
      { status: 500 }
    )
  }
}