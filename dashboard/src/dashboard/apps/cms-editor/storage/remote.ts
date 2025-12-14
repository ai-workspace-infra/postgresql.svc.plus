import { DraftStore } from './index'

export const remoteDraftStore: DraftStore = {
  async list() {
    throw new Error('Remote storage not implemented yet')
  },
  async load() {
    throw new Error('Remote storage not implemented yet')
  },
  async save() {
    throw new Error('Remote storage not implemented yet')
  },
  async remove() {
    throw new Error('Remote storage not implemented yet')
  },
}
