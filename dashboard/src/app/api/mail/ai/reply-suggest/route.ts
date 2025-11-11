import { NextRequest, NextResponse } from 'next/server'

import { getMessage, resolveTenantId } from '../../mockData'

export async function POST(request: NextRequest) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const body = (await request.json()) as { messageId: string; style?: string; language?: string }
  const message = body?.messageId ? getMessage(tenantId, body.messageId) : null

  const base = message?.aiInsights?.suggestions ?? [
    '收到，我们将安排同事跟进。',
    '感谢提醒，我们将及时回复。',
    '请告知是否需要更多信息。',
  ]

  return NextResponse.json({ suggestions: base })
}
