import { NextRequest, NextResponse } from 'next/server'

import { getMessage, resolveTenantId } from '../../mockData'

export async function POST(request: NextRequest) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const body = (await request.json()) as { messageId: string }
  const message = getMessage(tenantId, body.messageId)
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const labels = Array.from(new Set([...message.labels, 'AI-Reviewed']))
  return NextResponse.json({ labels })
}
