import ProductMatrix from '@components/home/ProductMatrix'

import { defaultHomeLayoutConfig } from '@cms/templates/default/config'

import { createCommonHomeTemplate } from '../layouts/commonHome'
import type { TemplateDefinition } from '../types'

const DefaultHomePageTemplate = createCommonHomeTemplate(defaultHomeLayoutConfig, {
  ProductMatrix,
})

const defaultTemplate: TemplateDefinition = {
  name: 'default',
  pages: {
    home: DefaultHomePageTemplate,
  },
}

export default defaultTemplate
