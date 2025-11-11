import { NextRequest, NextResponse } from 'next/server'

import { ContentNotFoundError, renderMarkdownFile } from '@server/render-markdown'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const result = await renderMarkdownFile(path)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ContentNotFoundError) {
      return NextResponse.json({ error: 'Markdown file not found' }, { status: 404 })
    }
    console.error('Failed to render markdown:', error)
    return NextResponse.json({ error: 'Failed to render markdown' }, { status: 500 })
  }
}
