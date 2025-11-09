import { Activity, Brain, Rocket, Shield } from 'lucide-react'

type ProductFeaturesProps = {
  lang: 'zh' | 'en'
}

const FEATURES = {
  zh: [
    {
      title: '极速连接',
      description: '智能就近接入、跨区域中转，降低首包延迟与抖动。',
      icon: Rocket,
    },
    {
      title: '安全加密',
      description: '端到端加密与最小暴露面设计，确保数据安全。',
      icon: Shield,
    },
    {
      title: 'AI 优化',
      description: '基于实时指标进行路径自适应选择，持续调优。',
      icon: Brain,
    },
    {
      title: '实时监控',
      description: '内置观测、告警与审计，掌握全链路健康。',
      icon: Activity,
    },
  ],
  en: [
    {
      title: 'Speed',
      description: 'Smart ingress and inter-region hops reduce latency and jitter.',
      icon: Rocket,
    },
    {
      title: 'Security',
      description: 'End-to-end encryption with minimal exposure surfaces.',
      icon: Shield,
    },
    {
      title: 'AI Optimization',
      description: 'Adaptive routing powered by live telemetry and policy controls.',
      icon: Brain,
    },
    {
      title: 'Live Metrics',
      description: 'Embedded observability, alerting, and auditing end to end.',
      icon: Activity,
    },
  ],
}

export default function ProductFeatures({ lang }: ProductFeaturesProps) {
  const items = FEATURES[lang]

  return (
    <section id="features" aria-labelledby="features-title" className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2 id="features-title" className="text-3xl font-bold text-slate-900">
            {lang === 'zh' ? '核心功能' : 'Core Features'}
          </h2>
          <p className="mt-2 text-slate-600">
            {lang === 'zh'
              ? '为稳定、低延迟的全球访问而生。'
              : 'Built for stable, low-latency global access.'}
          </p>
        </header>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Icon className="h-6 w-6 text-brand-dark" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
