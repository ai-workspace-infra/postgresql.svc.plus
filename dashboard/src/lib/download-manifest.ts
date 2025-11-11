import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

import type { DirListing } from '../types/download'

const readListings = (relativePath: string): DirListing[] => {
  try {
    const filePath = path.join(process.cwd(), relativePath)
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? (parsed as DirListing[]) : []
  } catch {
    return []
  }
}

const manifestListings = readListings('public/dl-index/artifacts-manifest.json')
const fallbackListings = readListings('public/dl-index/all.json')

export const DOWNLOAD_LISTINGS: DirListing[] =
  manifestListings.length > 0 ? manifestListings : fallbackListings

export function getDownloadListings(): DirListing[] {
  return DOWNLOAD_LISTINGS
}
