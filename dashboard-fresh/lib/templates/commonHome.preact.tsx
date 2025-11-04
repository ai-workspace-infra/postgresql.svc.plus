/**
 * Common Home Template Layout - Preact Version
 *
 * Fresh + Deno compatible version of the CMS template system
 */

import { ComponentChildren } from 'preact'

type SlotProps = Record<string, unknown>

type HeroSlotConfig = {
  key: string
  wrapperClassName?: string
  props?: SlotProps
}

type ContentSlotConfig = {
  key: string
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

type SlotComponents = Record<string, (props: any) => ComponentChildren>

interface TemplateProps {
  slots: SlotComponents
  config: CommonHomeLayoutConfig
}

function renderOverlays(overlays?: string[]) {
  return overlays?.map((className, index) => (
    <div key={index} class={className} aria-hidden />
  ))
}

export function CommonHomeTemplate({ slots, config }: TemplateProps) {
  const heroSlotConfig = config.hero.slot
  const HeroComponent = slots[heroSlotConfig.key]

  const heroContent = HeroComponent ? <HeroComponent {...(heroSlotConfig.props ?? {})} /> : null

  return (
    <main class={config.rootClassName}>
      <section class={config.hero.sectionClassName}>
        {renderOverlays(config.hero.overlays)}
        <div class={config.hero.containerClassName}>
          <div class={config.hero.contentClassName}>
            {heroSlotConfig.wrapperClassName ? (
              <div class={heroSlotConfig.wrapperClassName}>{heroContent}</div>
            ) : (
              heroContent
            )}
          </div>
        </div>
      </section>
      <section class={config.content.sectionClassName}>
        {renderOverlays(config.content.overlays)}
        <div class={config.content.containerClassName}>
          <div class={config.content.contentClassName}>
            <div class={config.content.gridClassName}>
              {config.content.slots.map((slotConfig) => {
                const SlotComponent = slots[slotConfig.key]

                if (!SlotComponent) {
                  return null
                }

                const slotElement = <SlotComponent {...(slotConfig.props ?? {})} />

                if (slotConfig.wrapperClassName) {
                  return (
                    <div key={slotConfig.key} class={slotConfig.wrapperClassName}>
                      {slotElement}
                    </div>
                  )
                }

                return <div key={slotConfig.key}>{slotElement}</div>
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export type { HeroSectionConfig, ContentSectionConfig, SlotComponents }
