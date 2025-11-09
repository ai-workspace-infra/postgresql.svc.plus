'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import type { ProductConfig } from '@src/products/registry'

export type Lang = 'zh' | 'en'

type ResourceLink = {
  href: string
  label: string
  description?: string
}

type ResourceGroup = {
  key: string
  title: string
  description?: string
  items: ResourceLink[]
}

const SUMMARY_LABEL: Record<Lang, string> = {
  zh: '项目简介',
  en: 'Overview',
}

const COPY = {
  zh: {
    navSeparator: '/',
    documentation: {
      title: '文档资料',
      description: '参考安装、配置与 API 说明。',
      quickstart: {
        label: '快速上手',
        hint: '从初始化到可用环境的全流程指引。',
      },
      api: {
        label: 'API 参考',
        hint: '接口定义与示例请求。',
      },
    },
    project: {
      title: '项目协作',
      description: '访问源码与问题跟踪渠道。',
      repository: {
        label: '源代码仓库',
        hint: 'GitHub 上维护的主仓库。',
      },
      issues: {
        label: '问题追踪',
        hint: '提交 issue 或查看现有讨论。',
      },
    },
    distribution: {
      title: '交付与部署',
      description: '下载发行版或获取自托管部署资源。',
      downloads: {
        label: '发行版下载',
        hint: '可执行文件、镜像与校验信息。',
      },
      artifactHint: '适用于自托管环境的附加资源。',
    },
    knowledge: {
      title: '学习资料',
      description: '了解更新节奏与实践案例。',
      blog: {
        label: '博客与更新',
        hint: '版本公告与架构文章。',
      },
      videos: {
        label: '录制演示',
        hint: '技术分享与操作演示。',
      },
    },
    languageToggleAria: '切换到英文',
  },
  en: {
    navSeparator: '/',
    documentation: {
      title: 'Documentation',
      description: 'Installation, configuration, and API references.',
      quickstart: {
        label: 'Quickstart',
        hint: 'End-to-end setup instructions for a working environment.',
      },
      api: {
        label: 'API reference',
        hint: 'Endpoints with request and response examples.',
      },
    },
    project: {
      title: 'Project collaboration',
      description: 'Access the source repository and issue tracker.',
      repository: {
        label: 'Source repository',
        hint: 'Primary GitHub repository.',
      },
      issues: {
        label: 'Issue tracker',
        hint: 'File new reports or review existing discussions.',
      },
    },
    distribution: {
      title: 'Distribution & deployment',
      description: 'Download releases or locate self-hosted resources.',
      downloads: {
        label: 'Release downloads',
        hint: 'Executables, container images, and checksums.',
      },
      artifactHint: 'Additional assets for self-hosted environments.',
    },
    knowledge: {
      title: 'Reference materials',
      description: 'Follow release notes and recorded sessions.',
      blog: {
        label: 'Blog updates',
        hint: 'Release announcements and architecture write-ups.',
      },
      videos: {
        label: 'Recorded sessions',
        hint: 'Technical talks and walkthroughs.',
      },
    },
    languageToggleAria: 'Switch to Chinese',
  },
} satisfies Record<Lang, Record<string, any>>

function buildResourceGroups(config: ProductConfig, lang: Lang): ResourceGroup[] {
  const t = COPY[lang]
  const groups: ResourceGroup[] = [
    {
      key: 'docs',
      title: t.documentation.title,
      description: t.documentation.description,
      items: [
        {
          href: config.docsQuickstart,
          label: t.documentation.quickstart.label,
          description: t.documentation.quickstart.hint,
        },
        {
          href: config.docsApi,
          label: t.documentation.api.label,
          description: t.documentation.api.hint,
        },
      ],
    },
    {
      key: 'project',
      title: t.project.title,
      description: t.project.description,
      items: [
        {
          href: config.repoUrl,
          label: t.project.repository.label,
          description: t.project.repository.hint,
        },
        {
          href: config.docsIssues,
          label: t.project.issues.label,
          description: t.project.issues.hint,
        },
      ],
    },
    {
      key: 'distribution',
      title: t.distribution.title,
      description: t.distribution.description,
      items: [
        {
          href: config.downloadUrl,
          label: t.distribution.downloads.label,
          description: t.distribution.downloads.hint,
        },
      ],
    },
    {
      key: 'knowledge',
      title: t.knowledge.title,
      description: t.knowledge.description,
      items: [
        {
          href: config.blogUrl,
          label: t.knowledge.blog.label,
          description: t.knowledge.blog.hint,
        },
        {
          href: config.videosUrl,
          label: t.knowledge.videos.label,
          description: t.knowledge.videos.hint,
        },
      ],
    },
  ]

  if (config.selfhostLinks?.length) {
    const items = config.selfhostLinks.map((link) => ({
      href: link.href,
      label: lang === 'zh' ? link.label_zh : link.label_en,
      description: t.distribution.artifactHint,
    }))
    groups.find((group) => group.key === 'distribution')!.items.push(...items)
  }

  return groups
}

function ResourceGroupCard({ title, description, items }: ResourceGroup) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      </div>
      <ul className="mt-4 space-y-4">
        {items.map(({ href, label, description: itemDescription }) => {
          const external = href.startsWith('http')
          return (
            <li key={`${title}-${href}`} className="text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-2 font-semibold text-brand transition hover:text-brand-dark"
                >
                  <span>{label}</span>
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              {itemDescription ? <p className="mt-1 text-xs text-slate-500">{itemDescription}</p> : null}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

function usePreferredLanguage(): Lang {
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const preferred = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh'
      setLang(preferred)
    }
  }, [])

  return lang
}

export default function Client({ config }: { config: ProductConfig }) {
  const preferred = usePreferredLanguage()
  const [lang, setLang] = useState<Lang>(preferred)

  useEffect(() => {
    setLang(preferred)
  }, [preferred])

  const handleToggleLanguage = useCallback(() => {
    setLang((current) => (current === 'zh' ? 'en' : 'zh'))
  }, [])

  const groups = useMemo(() => buildResourceGroups(config, lang), [config, lang])
  const summary = lang === 'zh' ? config.tagline_zh : config.tagline_en
  const title = lang === 'zh' ? config.title : config.title_en
  const toggleAria = lang === 'zh' ? COPY.zh.languageToggleAria : COPY.en.languageToggleAria
  const toggleLabel = lang === 'zh' ? 'EN' : '中文'

  return (
    <div className="bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span className="text-slate-500">SVC.plus</span>
            <span className="text-slate-400">{COPY[lang].navSeparator}</span>
            <span className="text-brand-dark">{config.name}</span>
          </Link>
          <button
            type="button"
            onClick={handleToggleLanguage}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            aria-label={toggleAria}
          >
            {toggleLabel}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1 text-xs font-semibold text-blue-700">
            {SUMMARY_LABEL[lang]}
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            <p className="text-base text-slate-700 sm:text-lg">{summary}</p>
          </div>
        </section>
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {groups.map((group) => (
            <ResourceGroupCard key={group.key} {...group} />
          ))}
        </section>
      </main>
    </div>
  )
}
