import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BellRing,
  Brain,
  Cloud,
  Coins,
  Database,
  GitBranch,
  Puzzle,
  Rocket,
  Shield,
  ShieldCheck,
} from 'lucide-react'

import type { ProductConfig } from '@src/products/registry'

type ProductFeaturesProps = {
  config: ProductConfig
  lang: 'zh' | 'en'
}

type FeatureDefinition = {
  title: string
  description: string
  icon: LucideIcon
}

type FeatureSet = {
  zh: FeatureDefinition[]
  en: FeatureDefinition[]
}

const DEFAULT_FEATURES: FeatureSet = {
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

const FEATURE_LIBRARY: Record<string, FeatureSet> = {
  xstream: DEFAULT_FEATURES,
  xscopehub: {
    zh: [
      {
        title: '全栈可观测数据',
        description: '统一聚合日志、指标与追踪，秒级关联上下游依赖。',
        icon: Database,
      },
      {
        title: 'AI 根因洞察',
        description: '基于时间序列与拓扑的智能关联分析，快速定位故障。',
        icon: Brain,
      },
      {
        title: '自动化告警编排',
        description: '多渠道告警与自愈策略编排，减少人工值守负担。',
        icon: BellRing,
      },
      {
        title: '生态级集成',
        description: '通过 Webhook 与插件体系，与 CI/CD、ITSM 平台无缝联动。',
        icon: Puzzle,
      },
    ],
    en: [
      {
        title: 'Full-stack telemetry',
        description: 'Unify logs, metrics, and traces with second-level dependency mapping.',
        icon: Database,
      },
      {
        title: 'AI-driven insights',
        description: 'Correlate time-series signals with topology to pinpoint root causes fast.',
        icon: Brain,
      },
      {
        title: 'Automated alerting',
        description: 'Orchestrate multichannel alerts and auto-remediation runbooks to cut toil.',
        icon: BellRing,
      },
      {
        title: 'Ecosystem integrations',
        description: 'Connect to CI/CD and ITSM systems through webhooks and an extensible plugin hub.',
        icon: Puzzle,
      },
    ],
  },
  xcloudflow: {
    zh: [
      {
        title: '多云蓝图编排',
        description: '跨公有云与私有云的资源模型统一建模，一次定义多环境复用。',
        icon: Cloud,
      },
      {
        title: 'GitOps 流水线',
        description: '将基础设施交付纳入 Git 审批与回滚流程，自动推进部署。',
        icon: GitBranch,
      },
      {
        title: '策略与合规',
        description: '内置策略扫描与准入控制，确保资源变更符合监管要求。',
        icon: ShieldCheck,
      },
      {
        title: '成本可视化',
        description: '实时跟踪多云资源使用与成本分摊，辅助优化预算。',
        icon: Coins,
      },
    ],
    en: [
      {
        title: 'Multi-cloud blueprints',
        description: 'Model infrastructure once and reuse across public and private clouds.',
        icon: Cloud,
      },
      {
        title: 'GitOps pipelines',
        description: 'Bring infrastructure delivery into Git reviews with automated rollouts.',
        icon: GitBranch,
      },
      {
        title: 'Policy & compliance',
        description: 'Built-in policy checks and admission controls enforce governance at deploy time.',
        icon: ShieldCheck,
      },
      {
        title: 'Cost visibility',
        description: 'Track multi-cloud spend and allocations in real time to optimize budgets.',
        icon: Coins,
      },
    ],
  },
}

export default function ProductFeatures({ config, lang }: ProductFeaturesProps) {
  const featureSet = FEATURE_LIBRARY[config.slug] ?? DEFAULT_FEATURES
  const items = featureSet[lang]
  const intro =
    lang === 'zh'
      ? `${config.name} 的核心能力组合，帮助团队快速落地。`
      : `Key capabilities from ${config.name} to help your team ship faster.`

  return (
    <section id="features" aria-labelledby="features-title" className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2 id="features-title" className="text-3xl font-bold text-slate-900">
            {lang === 'zh' ? '核心功能' : 'Core Features'}
          </h2>
          <p className="mt-2 text-slate-600">{intro}</p>
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
