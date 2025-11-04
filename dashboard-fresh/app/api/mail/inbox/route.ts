import { NextRequest, NextResponse } from 'next/server'

import { getInbox, resolveTenantId } from '../mockData'

export async function GET(request: NextRequest) {
  const tenantHeader = request.headers.get('x-tenant-id')
  const tenantQuery = request.nextUrl.searchParams.get('tenantId')
  const tenantId = resolveTenantId(tenantHeader ?? tenantQuery)

  const inbox = getInbox(tenantId)

  const label = request.nextUrl.searchParams.get('label')
  const query = request.nextUrl.searchParams.get('q')?.toLowerCase().trim()

  let filtered = inbox.messages
  if (label === 'unread') {
    filtered = filtered.filter((item) => item.unread)
  } else if (label === 'starred') {
    filtered = filtered.filter((item) => item.starred)
  } else if (label && label !== 'important') {
    filtered = filtered.filter((item) => item.labels.includes(label))
  }
  if (query) {
    filtered = filtered.filter((item) =>
      [item.subject, item.snippet, item.from.email, item.from.name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query)),
    )
  }

  return NextResponse.json({
    ...inbox,
    messages: filtered,
  })
}
