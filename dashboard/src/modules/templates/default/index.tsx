import ArticleFeed from '@components/home/ArticleFeed'
import ProductMatrix from '@components/home/ProductMatrix'
import Sidebar from '@components/home/Sidebar'

import { defaultHomeLayoutConfig } from '@cms/templates/default/config'

import { createCommonHomeTemplate } from '../layouts/commonHome'
import type { TemplateDefinition } from '../types'

const DefaultHomePageTemplate = createCommonHomeTemplate(defaultHomeLayoutConfig, {
  ProductMatrix,
  ArticleFeed,
  Sidebar,
})

const defaultTemplate: TemplateDefinition = {
  name: 'default',
  pages: {
    home: DefaultHomePageTemplate,
  },
}

export default defaultTemplate
