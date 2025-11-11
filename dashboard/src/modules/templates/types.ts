import type { ComponentType } from 'react'

export type TemplateSlots = Record<string, ComponentType>

export interface TemplateRenderProps<TSlots extends TemplateSlots = TemplateSlots> {
  slots: TSlots
  context?: Record<string, unknown>
}

export type TemplateComponent<TSlots extends TemplateSlots = TemplateSlots> = ComponentType<
  TemplateRenderProps<TSlots>
>

export interface HomePageTemplateSlots extends TemplateSlots {
  ProductMatrix: ComponentType
  ArticleFeed: ComponentType
  Sidebar: ComponentType
}

export type HomePageSlotKey = 'ProductMatrix' | 'ArticleFeed' | 'Sidebar'

export type HomePageTemplateProps = TemplateRenderProps<HomePageTemplateSlots>

export interface TemplateDefinition {
  name: string
  pages: {
    home: TemplateComponent<HomePageTemplateSlots>
    [key: string]: ComponentType<any> | undefined
  }
}
