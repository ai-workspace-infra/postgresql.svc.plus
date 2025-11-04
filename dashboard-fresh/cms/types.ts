import type { ComponentType, ReactNode } from 'react'

import type { HomePageTemplateSlots, TemplateRenderProps } from '../src/templates/types'

export interface CmsTemplate {
  name: string
  pages: {
    home: ComponentType<TemplateRenderProps<HomePageTemplateSlots>>
    [key: string]: ComponentType<any> | undefined
  }
}

export interface CmsTheme {
  name: string
  htmlAttributes?: Record<string, string>
  bodyClassName?: string
  Provider?: ComponentType<{ children: ReactNode }>
}

export interface CmsExtension {
  name: string
  providers?: ComponentType<{ children: ReactNode }>[]
  Layout?: ComponentType<{ children: ReactNode }>
}
