import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Client from './Client'
import { PRODUCT_MAP, getAllSlugs } from '@src/products/registry'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const config = PRODUCT_MAP.get(slug)

  if (!config) {
    return {}
  }

  const description = `${config.name} — ${config.tagline_en}`
  const canonical = `https://www.svc.plus/${config.slug}`

  return {
    title: config.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: config.title_en,
      description,
      images: [config.ogImage],
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title_en,
      description,
      images: [config.ogImage],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const config = PRODUCT_MAP.get(slug)

  if (!config) {
    notFound()
  }

  return <Client config={config} />
}
