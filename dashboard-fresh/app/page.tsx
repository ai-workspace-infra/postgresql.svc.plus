export const dynamic = 'error'

import ArticleFeed from '@components/home/ArticleFeed'
import ProductMatrix from '@components/home/ProductMatrix'
import Sidebar from '@components/home/Sidebar'
import MarkdownHomepage from '../ui/pages/homepage'
import { isFeatureEnabled } from '@lib/featureToggles'

import { getActiveTemplate } from '../src/templateRegistry'

export default function HomePage() {
  if (!isFeatureEnabled('cmsExperience', '/homepage/dynamic')) {
    return <MarkdownHomepage />
  }

  const template = getActiveTemplate()
  const HomePageTemplate = template.pages.home

  return (
    <HomePageTemplate
      slots={{
        ProductMatrix,
        ArticleFeed,
        Sidebar,
      }}
    />
  )
}
