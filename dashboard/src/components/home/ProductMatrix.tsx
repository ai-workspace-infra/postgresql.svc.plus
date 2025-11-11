import ContactPanel from './ContactPanel'
import ProductMatrixClient from './ProductMatrixClient'

import { getHeroSolutions } from '@cms/content'

export default async function ProductMatrix() {
  const solutions = await getHeroSolutions()

  if (!solutions.length) {
    return null
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12">
      <ProductMatrixClient solutions={solutions} />
      <ContactPanel className="w-full lg:sticky lg:top-0 lg:h-fit lg:w-[360px] lg:self-start" />
    </div>
  )
}
