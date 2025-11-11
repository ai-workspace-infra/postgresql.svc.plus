import { ComponentType, createElement, isValidElement, type ReactNode } from 'react'

import { cmsConfig, type ExtensionName, type ThemeName } from './config'
import type { CmsExtension, CmsTheme } from './types'
import { appShellExtension } from './extensions/appShell'
import { markdownSyncExtension } from './extensions/markdownSync'
import defaultTheme from './themes/default'
import { AppShellBypass } from '../lib/appShellBypass'

const themeRegistry: Record<ThemeName, CmsTheme> = {
  default: defaultTheme,
}

const extensionRegistry: Record<ExtensionName, CmsExtension> = {
  'app-shell': appShellExtension,
  'markdown-sync': markdownSyncExtension,
}

export function getActiveTheme(): CmsTheme {
  return themeRegistry[cmsConfig.theme]
}

export function getActiveExtensions(): CmsExtension[] {
  return cmsConfig.extensions
    .map((extensionName) => extensionRegistry[extensionName])
    .filter(Boolean)
}

export function collectExtensionProviders(): ComponentType<{ children: ReactNode }>[] {
  return getActiveExtensions().flatMap((extension) => extension.providers ?? [])
}

export function applyExtensionLayouts(children: ReactNode): ReactNode {
  const { content, skipAppShell } = unwrapAppShellBypass(children)

  return getActiveExtensions().reduceRight((acc, extension) => {
    if (!extension.Layout) {
      return acc
    }
    if (skipAppShell && extension.name === 'app-shell') {
      return acc
    }
    const LayoutComponent = extension.Layout
    return createElement(LayoutComponent, null, acc)
  }, content)
}

function unwrapAppShellBypass(node: ReactNode): { content: ReactNode; skipAppShell: boolean } {
  if (isValidElement(node) && (node.type as any) === AppShellBypass) {
    return { content: (node.props as any).children, skipAppShell: true }
  }

  return { content: node, skipAppShell: false }
}
