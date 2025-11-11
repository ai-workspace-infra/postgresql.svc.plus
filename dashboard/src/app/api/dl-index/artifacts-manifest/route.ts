import { NextResponse } from 'next/server'

const ARTIFACTS_MANIFEST_URL = 'https://dl.svc.plus/dl-index/artifacts-manifest.json'

export async function GET() {
  try {
    const response = await fetch(ARTIFACTS_MANIFEST_URL, {
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch artifacts manifest: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching artifacts manifest:', error)
    return NextResponse.json([], { status: 200 })
  }
}
