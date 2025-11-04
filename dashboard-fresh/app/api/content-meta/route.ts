import { NextRequest, NextResponse } from 'next/server'

import { ContentNotFoundError, getContentCommitMeta } from '../../../api/content-meta'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const result = await getContentCommitMeta(path)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ContentNotFoundError) {
      return NextResponse.json({ error: 'Content file not found' }, { status: 404 })
    }
    console.error('Failed to load content metadata:', error)
    return NextResponse.json({ error: 'Failed to load metadata' }, { status: 500 })
  }
}
