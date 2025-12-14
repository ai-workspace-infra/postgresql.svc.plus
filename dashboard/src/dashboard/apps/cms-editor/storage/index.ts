export type DraftMetadata = {
  id: string
  title: string
  updatedAt: number
}

export type DraftContent = {
  id: string
  title: string
  content: string
  updatedAt: number
}

export type SaveDraftInput = {
  id?: string
  title: string
  content: string
}

export interface DraftStore {
  list(): Promise<DraftMetadata[]>
  load(id: string): Promise<DraftContent | null>
  save(input: SaveDraftInput): Promise<string>
  remove(id: string): Promise<void>
}
