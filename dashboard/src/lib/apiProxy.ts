import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DEFAULT_FORWARD_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'cookie',
  'user-agent',
  'x-account-session',
  'x-forwarded-for',
  'x-request-id',
  'x-trace-id',
] as const

const BODYLESS_METHODS = new Set(['GET', 'HEAD'])

type ProxyOptions = {
  upstreamBaseUrl: string
  upstreamPathPrefix: string
  allowedHeaders?: readonly string[]
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function buildTargetUrl(request: NextRequest, { upstreamBaseUrl, upstreamPathPrefix }: ProxyOptions): string {
  const normalizedBase = stripTrailingSlash(upstreamBaseUrl)
  const normalizedPrefix = upstreamPathPrefix.startsWith('/') ? upstreamPathPrefix : `/${upstreamPathPrefix}`
  const suffix = request.nextUrl.pathname.slice(normalizedPrefix.length)
  const normalizedSuffix = suffix.startsWith('/') ? suffix : suffix ? `/${suffix}` : ''
  const search = request.nextUrl.search ?? ''
  return `${normalizedBase}${normalizedPrefix}${normalizedSuffix}${search}`
}

function buildForwardHeaders(request: NextRequest, allowedHeaders: readonly string[] = DEFAULT_FORWARD_HEADERS) {
  const headers = new Headers()
  for (const name of allowedHeaders) {
    const value = request.headers.get(name)
    if (value) {
      headers.set(name, value)
    }
  }
  return headers
}

function applySetCookieHeaders(source: Headers, target: Headers) {
  const getSetCookie = (source as Headers & { getSetCookie?: () => string[] }).getSetCookie
  if (typeof getSetCookie === 'function') {
    for (const cookie of getSetCookie.call(source)) {
      target.append('set-cookie', cookie)
    }
    return
  }

  const cookie = source.get('set-cookie')
  if (cookie) {
    target.append('set-cookie', cookie)
  }
}

export async function proxyRequestToUpstream(request: NextRequest, options: ProxyOptions): Promise<Response> {
  const targetUrl = buildTargetUrl(request, options)
  const forwardHeaders = buildForwardHeaders(request, options.allowedHeaders)

  let body: ArrayBuffer | undefined
  if (!BODYLESS_METHODS.has(request.method.toUpperCase())) {
    body = await request.arrayBuffer()
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: body ? Buffer.from(body) : undefined,
      cache: 'no-store',
      redirect: 'manual',
    })
  } catch (error) {
    console.error('Proxy request failed', error)
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 })
  }

  const responseHeaders = new Headers()
  upstreamResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return
    }
    responseHeaders.set(key, value)
  })
  applySetCookieHeaders(upstreamResponse.headers, responseHeaders)
  responseHeaders.set('Cache-Control', 'no-store')

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

export function createUpstreamProxyHandler(options: ProxyOptions) {
  return function handler(request: NextRequest) {
    return proxyRequestToUpstream(request, options)
  }
}
