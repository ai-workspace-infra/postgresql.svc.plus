import Link from 'next/link'

import type { ProductConfig } from '@src/products/registry'

type ProductEditionsProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
}

const SECTION_COPY = {
  zh: {
    title: '版本与部署',
    description: '开源可扩展，可自建或选择官方托管服务。',
    actions: {
      selfhost: '自建（Self-Hosted）',
      managed: '托管（Managed）',
      paygo: '按量计费（Pay-as-you-go）',
      saas: '订阅 SaaS',
    },
  },
  en: {
    title: 'Editions & Deployment',
    description: 'Open source and extensible—self-host or leverage managed offerings.',
    actions: {
      selfhost: 'Self-Hosted',
      managed: 'Managed',
      paygo: 'Pay-as-you-go',
      saas: 'SaaS Subscription',
    },
  },
}

type EditionKey = keyof ProductConfig['editions']

export default function ProductEditions({ config, lang }: ProductEditionsProps) {
  const copy = SECTION_COPY[lang]
  const order: EditionKey[] = ['selfhost', 'managed', 'paygo', 'saas']

  return (
    <section id="editions" aria-labelledby="editions-title" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2 id="editions-title" className="text-3xl font-bold text-slate-900">
            {copy.title}
          </h2>
          <p className="mt-2 text-slate-600">{copy.description}</p>
        </header>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {order.map((key) => (
            <article
              key={key}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {copy.actions[key]}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {config.editions[key].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noreferrer' : undefined}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {link.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
