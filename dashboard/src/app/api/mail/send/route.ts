import { NextRequest, NextResponse } from 'next/server'

import type { ComposePayload } from '@lib/mail/types'

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ComposePayload
  void payload
  return NextResponse.json({ success: true })
}
