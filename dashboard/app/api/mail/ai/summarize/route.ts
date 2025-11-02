import { NextRequest, NextResponse } from 'next/server'

import { getMessage, resolveTenantId } from '../../mockData'

export async function POST(request: NextRequest) {
  const tenantId = resolveTenantId(request.headers.get('x-tenant-id'))
  const body = (await request.json()) as { messageId?: string; raw?: string }
  if (!body.messageId && !body.raw) {
    return NextResponse.json({ error: 'messageId or raw is required' }, { status: 400 })
  }

  if (body.messageId) {
    const message = getMessage(tenantId, body.messageId)
    if (!message) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (message.aiInsights) {
      return NextResponse.json(message.aiInsights)
    }
  }

  return NextResponse.json({
    summary: '示例摘要：邮件内容将提炼为关键句子。',
    bullets: ['示例要点一', '示例要点二'],
    actions: ['示例行动一'],
    tone: '信息',
  })
}
