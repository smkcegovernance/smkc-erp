import { NextRequest, NextResponse } from 'next/server'

const LEGACY_API_PREFIX = '/api/women-child-welfare'

function getLegacyBaseUrl(): string {
  const baseUrl = process.env.SMKC_API_BASE_URL ?? ''
  if (!baseUrl) {
    throw new Error('SMKC_API_BASE_URL environment variable is not set')
  }
  return baseUrl
}

function buildLegacyUrl(pathWithQuery: string): string {
  return new URL(pathWithQuery, getLegacyBaseUrl()).toString()
}

function copyResponseHeaders(source: Headers): Headers {
  const headers = new Headers()
  const contentType = source.get('content-type')
  const contentDisposition = source.get('content-disposition')

  if (contentType) {
    headers.set('content-type', contentType)
  }

  if (contentDisposition) {
    headers.set('content-disposition', contentDisposition)
  }

  return headers
}

async function readForwardBody(req: NextRequest): Promise<{ body: BodyInit | undefined; contentType: string | null }> {
  const contentType = req.headers.get('content-type')
  if (!contentType) {
    return { body: undefined, contentType: null }
  }

  const bytes = Buffer.from(await req.arrayBuffer())
  if (bytes.length === 0) {
    return { body: undefined, contentType }
  }

  return {
    body: bytes,
    contentType,
  }
}

export async function proxyWcwcRequest(method: string, pathWithQuery: string, req?: NextRequest): Promise<NextResponse> {
  try {
    const { body, contentType } = req
      ? await readForwardBody(req)
      : { body: undefined, contentType: null }

    const headers = new Headers()
    if (contentType) {
      headers.set('content-type', contentType)
    }

    const response = await fetch(buildLegacyUrl(pathWithQuery), {
      method,
      headers,
      body,
      cache: 'no-store',
    })

    const responseBody = await response.arrayBuffer()
    return new NextResponse(responseBody, {
      status: response.status,
      headers: copyResponseHeaders(response.headers),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reach WCWC API'
    return NextResponse.json(
      {
        success: false,
        message,
        errorCode: 'WCWC_PROXY_ERROR',
      },
      { status: 502 }
    )
  }
}

export function buildWcwcPath(relativePath: string, search: string): string {
  return `${LEGACY_API_PREFIX}${relativePath}${search}`
}