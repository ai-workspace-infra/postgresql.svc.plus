import { NextRequest, NextResponse } from 'next/server'

import { getNamespace, resolveTenantId, updateNamespace } from '../mockData'

export async function GET(request: NextRequest) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  return NextResponse.json(getNamespace(tenantId))
}

export async function PUT(request: NextRequest) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const patch = (await request.json()) as Record<string, unknown>
  return NextResponse.json(updateNamespace(tenantId, patch))
}
