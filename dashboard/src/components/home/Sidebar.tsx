'use client'

import { useLanguage } from '../../i18n/LanguageProvider'
import SidebarCard from './SidebarCard'

const sidebarContent = {
  zh: {
    sections: [
      {
        slug: 'community',
        title: '社区热议',
        items: [
          { label: 'GitOps 最佳实践', href: '#' },
          { label: '多云治理讨论', href: '#' },
          { label: '可观测性方案', href: '#' },
        ],
      },
      {
        slug: 'resources',
        title: '推荐资源',
        items: [
          { label: 'XCloudFlow 文档', href: '#' },
          { label: 'XScopeHub 指南', href: '#' },
          { label: 'XStream 教程', href: '#' },
        ],
      },
      {
        slug: 'tags',
        title: '热门标签',
        items: [
          { label: 'GitOps', href: '#' },
          { label: 'IaC', href: '#' },
          { label: '多云', href: '#' },
          { label: '可观测性', href: '#' },
        ],
      },
    ],
  },
  en: {
    sections: [
      {
        slug: 'community',
        title: 'Community Highlights',
        items: [
          { label: 'GitOps Best Practices', href: '#' },
          { label: 'Multi-Cloud Governance', href: '#' },
          { label: 'Observability Solutions', href: '#' },
        ],
      },
      {
        slug: 'resources',
        title: 'Recommended Resources',
        items: [
          { label: 'XCloudFlow Docs', href: '#' },
          { label: 'XScopeHub Guide', href: '#' },
          { label: 'XStream Tutorial', href: '#' },
        ],
      },
      {
        slug: 'tags',
        title: 'Popular Tags',
        items: [
          { label: 'GitOps', href: '#' },
          { label: 'IaC', href: '#' },
          { label: 'Multi-Cloud', href: '#' },
          { label: 'Observability', href: '#' },
        ],
      },
    ],
  },
}

export default function Sidebar() {
  const { language } = useLanguage()
  const data = sidebarContent[language]

  return (
    <aside className="w-full space-y-6 rounded-2xl border border-brand-border bg-white p-6 text-brand-heading shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-0 lg:h-fit lg:w-[360px]">
      {data.sections.map((section) => (
        <div key={section.slug} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm text-brand transition hover:text-brand-dark"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
