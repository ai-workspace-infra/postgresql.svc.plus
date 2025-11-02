import { NextRequest, NextResponse } from 'next/server'

import { getMessage, resolveTenantId } from '../../mockData'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const message = getMessage(tenantId, params.id)
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(message)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const message = getMessage(tenantId, params.id)
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
