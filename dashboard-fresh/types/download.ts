export interface DirEntry {
  name: string
  href: string
  type: 'file' | 'dir'
  size?: number
  lastModified?: string
  sha256?: string
}

export interface DirListing {
  path: string
  entries: DirEntry[]
}
