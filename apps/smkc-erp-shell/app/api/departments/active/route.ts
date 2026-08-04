import { NextRequest, NextResponse } from 'next/server'
import { apiServer } from '@smkc/api-client'
import { DEPARTMENTS } from '@smkc/types'

export async function GET(_req: NextRequest) {
  try {
    const data = await apiServer.get('/api/departments/active')
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Fallback keeps shell usable when legacy/local API build does not expose
    // /api/departments/active yet.
    if (message.includes('failed: 404') || message.includes('controller named')) {
      const fallback = DEPARTMENTS.map((d, idx) => ({
        deptCode: idx + 1,
        routeKey: d.key,
        nameEn: d.label,
        nameMr: d.label,
        icon: d.icon,
        color: d.color,
        colorBg: d.colorBg,
        displayOrder: idx + 1,
      }))

      return NextResponse.json(
        {
          success: true,
          data: fallback,
          source: 'fallback-static',
          message: 'Using static departments list because backend endpoint is unavailable.',
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: false, message },
      { status: 502 }
    )
  }
}
