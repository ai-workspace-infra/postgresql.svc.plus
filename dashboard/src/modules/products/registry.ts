import xcloudflow from './xcloudflow'
import xscopehub from './xscopehub'
import xstream from './xstream'

export type EditionLink = {
  label: string
  href: string
  external?: boolean
}

export type Editions = {
  selfhost: EditionLink[]
  managed: EditionLink[]
  paygo: EditionLink[]
  saas: EditionLink[]
}

export type ProductConfig = {
  slug: string
  name: string
  title: string
  title_en: string
  tagline_zh: string
  tagline_en: string
  ogImage: string
  repoUrl: string
  docsQuickstart: string
  docsApi: string
  docsIssues: string
  blogUrl: string
  videosUrl: string
  downloadUrl: string
  editions: Editions
  billing?: {
    paygo?: BillingPlan
    saas?: BillingPlan
  }
}

export type BillingPlan = {
  name: string
  description?: string
  price: number
  currency: string
  interval?: string
  planId?: string
  clientId?: string
  meta?: Record<string, unknown>
}

export const PRODUCT_LIST: ProductConfig[] = [xstream, xscopehub, xcloudflow]

export const PRODUCT_MAP = new Map<string, ProductConfig>(
  PRODUCT_LIST.map((product) => [product.slug, product])
)

export const getAllSlugs = (): string[] => PRODUCT_LIST.map((product) => product.slug)
