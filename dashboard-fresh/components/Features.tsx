'use client'
import { useLanguage } from '../i18n/LanguageProvider'
import { translations } from '../i18n/translations'

const features = [
  {
    icon: '🛠️',
    title: {
      en: 'XCloudFlow - Multi-Cloud IaC',
      zh: 'XCloudFlow - 多云 IaC',
    },
    desc: {
      en: 'Provision cloud resources across AWS, GCP, Azure, and Kubernetes using Golang with Pulumi SDK, fully integrated into CI/CD pipelines.',
      zh: '使用 Golang 和 Pulumi SDK 跨 AWS、GCP、Azure 与 Kubernetes 统一部署云资源，完美集成 CI/CD 流水线。',
    },
  },
  {
    icon: '🔐',
    title: {
      en: 'KubeGuard - Kubernetes Backup',
      zh: 'KubeGuard - Kubernetes 备份',
    },
    desc: {
      en: 'Velero + Rsync combined solution for full-stack Kubernetes application & node data backup, fast restore, and cluster migration.',
      zh: '结合 Velero 与 Rsync 实现 Kubernetes 应用与节点数据完整备份、快速恢复与集群迁移。',
    },
  },
  {
    icon: '📦',
    title: {
      en: 'XConfig - Configuration Orchestration',
      zh: 'XConfig - 配置编排',
    },
    desc: {
      en: 'YAML Playbook driven configuration delivery and task orchestration, optimized for bare metal, edge nodes and hybrid clusters.',
      zh: '基于 YAML Playbook 驱动的配置交付与任务编排，适配裸金属、边缘节点与混合集群。',
    },
  },
  {
    icon: '📡',
    title: {
      en: 'XScopeHub - Observability Hub',
      zh: 'XScopeHub - 可观察性平台',
    },
    desc: {
      en: 'Bridges exporters, OpenTelemetry, and OpenObserve with ETL pipelines for metrics, logs, and traces.',
      zh: '通过 OpenTelemetry 框架连接 Exporter、OpenObserve 与 ETL 流程，实现指标、日志与调用的统一聚合。',
    },
  },
  {
    icon: '🧭',
    title: {
      en: 'Navi - Task Assistant',
      zh: 'Navi - 任务助手',
    },
    desc: {
      en: 'Guiding your tasks, helping you get things done faster.',
      zh: '引导你的任务，帮助你更快完成工作。',
    },
  },
  {
    icon: '🚀',
    title: {
      en: 'XStream - Network Accelerator',
      zh: 'XStream - 网络加速器',
    },
    desc: {
      en: 'Cross-border developer proxy built with VLESS+gRPC to ensure fast, stable access to GitHub, DockerHub, AI models and global resources.',
      zh: '基于 VLESS+gRPC 的跨境开发者代理，确保稳定快速访问 GitHub、DockerHub、AI 模型与全球资源。',
    },
  },
]

export default function Features() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section id="features" className="bg-[var(--color-background)] py-20 text-[var(--color-text)] transition-colors">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{t.featuresTitle}</h2>
          <p className="text-[var(--color-text-subtle)]">{t.featuresSubtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-xl)] border border-[color:var(--color-surface-border)] bg-[var(--color-surface)] p-6 text-left transition-colors hover:border-[color:var(--color-primary-border)] hover:bg-[var(--color-surface-muted)]"
            >
              <div className="mb-4 text-4xl">{f.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-[var(--color-text)]">{f.title[language]}</h3>
              <p className="text-[var(--color-text-subtle)]">{f.desc[language]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
