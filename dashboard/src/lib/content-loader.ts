import homepageContent from '../data/content/homepage.json'
import xstreamContent from '../data/content/xstream.json'
import xcloudflowContent from '../data/content/xcloudflow.json'
import xscopehubContent from '../data/content/xscopehub.json'

export type Language = 'zh' | 'en'

export type HeroContent = {
  eyebrow: string
  title: string
  tagline?: string
  description: string
  focusAreas?: string[]
  ctaLabel?: string
  products?: Array<{
    label: string
    headline: string
    description: string
    href: string
  }>
}

export type FeatureContent = {
  title: string
  sections?: Array<{
    heading: string
    description: string
  }>
}

export function loadHeroContent(
  type: 'homepage' | 'product',
  product?: 'xstream' | 'xcloudflow' | 'xscopehub',
  language: Language = 'zh'
): HeroContent | null {
  try {
    let content: any

    if (type === 'homepage') {
      content = homepageContent
    } else if (product === 'xstream') {
      content = xstreamContent
    } else if (product === 'xcloudflow') {
      content = xcloudflowContent
    } else if (product === 'xscopehub') {
      content = xscopehubContent
    } else {
      return null
    }

    return content[language] || null
  } catch (error) {
    console.error(`Failed to load hero content for ${type}/${product}:`, error)
    return null
  }
}

export function loadFeatureContent(
  product: 'xstream' | 'xcloudflow' | 'xscopehub',
  section: 'features' | 'editions' | 'scenarios' | 'faq',
  language: Language = 'zh'
): FeatureContent | null {
  try {
    // TODO: Implement feature content loading
    console.warn('Feature content loading not yet implemented')
    return null
  } catch (error) {
    console.error(`Failed to load feature content for ${product}/${section}:`, error)
    return null
  }
}
