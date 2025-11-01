import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function stripTrailingSlashes(pathname: string) {
  if (pathname.length <= 1) return pathname
  return pathname.replace(/\/+$/u, '')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname === '/api' || pathname.startsWith('/api/')
  const shouldStrip = isApiRoute && pathname.length > 1 && pathname.endsWith('/')

  if (!shouldStrip) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = stripTrailingSlashes(pathname)

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/api/:path*'],
}
