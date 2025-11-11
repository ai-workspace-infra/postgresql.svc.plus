import path from 'path'

import { cmsConfig } from '../config'

export interface ResolvedContentSource {
  namespace: string
  absolutePath: string
  type: 'filesystem' | 'git'
  repository?: string
  ref?: string
}

export function resolveContentSource(namespace?: string): ResolvedContentSource {
  if (typeof window !== 'undefined') {
    throw new Error('resolveContentSource can only be called on the server')
  }

  const targetNamespace = namespace ?? cmsConfig.content.defaultNamespace
  const source = cmsConfig.content.sources[targetNamespace]
  if (!source) {
    const fallbackRoot = path.join(
      process.cwd(),
      'src',
      'lib',
      'cms',
      'content',
      targetNamespace
    )
    return {
      namespace: targetNamespace,
      absolutePath: fallbackRoot,
      type: 'filesystem',
    }
  }

  return {
    namespace: targetNamespace,
    absolutePath: path.isAbsolute(source.root)
      ? source.root
      : path.join(process.cwd(), source.root),
    type: source.type,
    repository: source.repository,
    ref: source.ref,
  }
}
