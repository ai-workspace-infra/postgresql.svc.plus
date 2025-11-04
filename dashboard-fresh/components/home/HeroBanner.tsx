import { getHomepageHero, getHeroSolutions } from '@cms/content'
import HeroBannerClient from './HeroBannerClient'

export default async function HeroBanner() {
  const [hero, solutions] = await Promise.all([getHomepageHero(), getHeroSolutions()])

  return <HeroBannerClient hero={hero} solutions={solutions} />
}
