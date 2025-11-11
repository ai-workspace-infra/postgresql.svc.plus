import { cmsConfig } from './config'

export function listContentSourcesMetadata() {
  return Object.entries(cmsConfig.content.sources).map(([namespace, source]) => ({
    namespace,
    type: source.type,
    repository: source.repository,
    ref: source.ref,
  }))
}
