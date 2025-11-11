import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

type ProductScenariosProps = {
  lang: 'zh' | 'en'
}

const SCENARIOS = {
  zh: [
    {
      title: 'AI 模型 / DevTools 加速',
      description: '保障 ChatGPT、Gemini、Claude 等模型服务顺畅访问。',
    },
    {
      title: 'GitHub / 镜像分发',
      description: '加速代码克隆、Release 下载与容器镜像同步。',
    },
    {
      title: '跨境办公 / 媒体服务',
      description: '优化海外购物、视频、音乐等站点体验。',
    },
  ],
  en: [
    {
      title: 'AI APIs & Dev Tools',
      description: 'Keep ChatGPT, Gemini, Claude, and dependency downloads flowing.',
    },
    {
      title: 'GitHub & Registry Sync',
      description: 'Accelerate git clones, release artifacts, and container pulls.',
    },
    {
      title: 'Cross-border Work & Media',
      description: 'Improve shopping, video, and media experiences worldwide.',
    },
  ],
}

export default function ProductScenarios({ lang }: ProductScenariosProps) {
  const items = SCENARIOS[lang]

  return (
    <section id="scenarios" aria-labelledby="scenarios-title" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="scenarios-title" className="text-3xl font-bold text-slate-900">
              {lang === 'zh' ? '典型应用场景' : 'Typical Use Cases'}
            </h2>
            <p className="mt-2 text-slate-600">
              {lang === 'zh'
                ? '聚焦开发者常用服务与日常访问，游戏等超低延迟场景不做覆盖。'
                : 'Focused on developer services and daily access—not tuned for ultra-low-latency gaming.'}
            </p>
          </div>
          <Link
            href="#docs"
            scroll
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
          >
            {lang === 'zh' ? '查看使用说明' : 'Read the guide'}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ title, description }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm text-slate-600">{description}</p>
              <Link
                href="#docs"
                scroll
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
              >
                {lang === 'zh' ? '了解详情' : 'Learn more'}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
