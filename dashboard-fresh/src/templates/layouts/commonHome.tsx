import { Fragment, type ComponentType } from 'react'
import clsx from 'clsx'

import type { HomePageSlotKey, HomePageTemplateSlots, TemplateComponent } from '../types'

type SlotProps = Record<string, unknown>

type HeroSlotConfig = {
  key: HomePageSlotKey
  wrapperClassName?: string
  props?: SlotProps
}

type ContentSlotConfig = {
  key: HomePageSlotKey
  wrapperClassName?: string
  props?: SlotProps
}

type SectionBaseConfig = {
  sectionClassName?: string
  containerClassName?: string
  contentClassName?: string
  overlays?: string[]
}

type HeroSectionConfig = SectionBaseConfig & {
  slot: HeroSlotConfig
}

type ContentSectionConfig = SectionBaseConfig & {
  gridClassName?: string
  slots: ContentSlotConfig[]
}

export interface CommonHomeLayoutConfig {
  rootClassName?: string
  hero: HeroSectionConfig
  content: ContentSectionConfig
}

type FallbackMap = Partial<Record<HomePageSlotKey, ComponentType<any>>>

function renderOverlays(overlays?: string[]) {
  return overlays?.map((className, index) => (
    <div key={index} className={className} aria-hidden />
  ))
}

export function createCommonHomeTemplate(
  config: CommonHomeLayoutConfig,
  fallbacks: FallbackMap = {},
): TemplateComponent<HomePageTemplateSlots> {
  const Template: TemplateComponent<HomePageTemplateSlots> = ({ slots }) => {
    const heroSlotConfig = config.hero.slot
    const HeroComponent = (slots[heroSlotConfig.key] ?? fallbacks[heroSlotConfig.key]) as
      | ComponentType<any>
      | undefined

    const heroContent = HeroComponent ? <HeroComponent {...(heroSlotConfig.props ?? {})} /> : null

    return (
      <main className={clsx(config.rootClassName)}>
        <section className={clsx(config.hero.sectionClassName)}>
          {renderOverlays(config.hero.overlays)}
          <div className={clsx(config.hero.containerClassName)}>
            <div className={clsx(config.hero.contentClassName)}>
              {heroSlotConfig.wrapperClassName ? (
                <div className={clsx(heroSlotConfig.wrapperClassName)}>{heroContent}</div>
              ) : (
                heroContent
              )}
            </div>
          </div>
        </section>
        <section className={clsx(config.content.sectionClassName)}>
          {renderOverlays(config.content.overlays)}
          <div className={clsx(config.content.containerClassName)}>
            <div className={clsx(config.content.contentClassName)}>
              <div className={clsx(config.content.gridClassName)}>
                {config.content.slots.map((slotConfig) => {
                  const SlotComponent = (slots[slotConfig.key] ?? fallbacks[slotConfig.key]) as
                    | ComponentType<any>
                    | undefined

                  if (!SlotComponent) {
                    return null
                  }

                  const slotElement = <SlotComponent {...(slotConfig.props ?? {})} />

                  if (slotConfig.wrapperClassName) {
                    return (
                      <div key={slotConfig.key} className={clsx(slotConfig.wrapperClassName)}>
                        {slotElement}
                      </div>
                    )
                  }

                  return <Fragment key={slotConfig.key}>{slotElement}</Fragment>
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return Template
}

export type { HeroSectionConfig, ContentSectionConfig }
