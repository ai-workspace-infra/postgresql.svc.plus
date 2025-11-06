import { NextRequest, NextResponse } from 'next/server'

import { getMessage, resolveTenantId } from '../../mockData'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const { id } = await params
  const message = getMessage(tenantId, id)
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(message)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const { id } = await params
  const message = getMessage(tenantId, id)
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
