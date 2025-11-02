export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'

import { createUpstreamProxyHandler } from '@lib/apiProxy'
import { getInternalServerServiceBaseUrl } from '@server/serviceConfig'

const AGENT_PREFIX = '/api/agent'

function createHandler() {
  const upstreamBaseUrl = getInternalServerServiceBaseUrl()
  return createUpstreamProxyHandler({
    upstreamBaseUrl,
    upstreamPathPrefix: AGENT_PREFIX,
  })
}

const handler = createHandler()

export function GET(request: NextRequest) {
  return handler(request)
}

export function POST(request: NextRequest) {
  return handler(request)
}

export function PUT(request: NextRequest) {
  return handler(request)
}

export function PATCH(request: NextRequest) {
  return handler(request)
}

export function DELETE(request: NextRequest) {
  return handler(request)
}

export function HEAD(request: NextRequest) {
  return handler(request)
}

export function OPTIONS(request: NextRequest) {
  return handler(request)
}
