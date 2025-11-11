import ProductMatrixClient from './ProductMatrixClient'

import { getHeroSolutions } from '@cms/content'

export default async function ProductMatrix() {
  const solutions = await getHeroSolutions()

  if (!solutions.length) {
    return null
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <ProductMatrixClient solutions={solutions} />
      </div>
    </div>
  )
}
