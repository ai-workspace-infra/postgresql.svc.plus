export const dynamic = 'error'

import ProductMatrix from '@components/home/ProductMatrix'
import CommunityFeedServer from '@components/home/CommunityFeedServer'
import HomepageLanding from '@modules/homepage/page'
import { isFeatureEnabled } from '@lib/featureToggles'

import { getActiveTemplate } from '@modules/templateRegistry'

export default function HomePage() {
  if (!isFeatureEnabled('cmsExperience', '/homepage/dynamic')) {
    return <HomepageLanding />
  }

  const template = getActiveTemplate()
  const HomePageTemplate = template.pages.home

  return (
    <HomePageTemplate
      slots={{
        ProductMatrix,
        CommunityFeed: CommunityFeedServer,
      }}
    />
  )
}
