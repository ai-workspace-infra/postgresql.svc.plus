import { NextResponse } from 'next/server'

const DOCS_MANIFEST_URL = 'https://dl.svc.plus/dl-index/docs-manifest.json'

export async function GET() {
  try {
    const response = await fetch(DOCS_MANIFEST_URL, {
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch docs manifest: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching docs manifest:', error)
    return NextResponse.json([], { status: 200 })
  }
}
