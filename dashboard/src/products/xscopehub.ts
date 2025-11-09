import type { ProductConfig } from './registry'

const xscopehub: ProductConfig = {
  slug: 'xscopehub',
  name: 'XScopeHub',
  title: 'XScopeHub — 云原生可观测性控制台',
  title_en: 'XScopeHub — Cloud Observability Hub',
  tagline_zh: '提供统一的指标、日志与链路追踪视图，并支持集中管理告警策略。',
  tagline_en: 'Provides unified views for metrics, logs, and traces with centralized alert management.',
  ogImage: 'https://www.svc.plus/assets/og/xscopehub.png',
  repoUrl: 'https://github.com/Cloud-Neutral/XScopeHub',
  docsQuickstart: 'https://www.svc.plus/xscopehub/docs/quickstart',
  docsApi: 'https://www.svc.plus/xscopehub/docs/api',
  docsIssues: 'https://github.com/Cloud-Neutral/XScopeHub/issues',
  blogUrl: 'https://www.svc.plus/blog/tags/xscopehub',
  videosUrl: 'https://www.svc.plus/videos/xscopehub',
  downloadUrl: 'https://www.svc.plus/xscopehub/downloads',
  selfhostLinks: [
    {
      label_zh: '部署包下载',
      label_en: 'Deployment packages',
      href: 'https://www.svc.plus/xscopehub/downloads',
    },
    {
      label_zh: 'Helm Chart',
      label_en: 'Helm chart',
      href: 'https://github.com/Cloud-Neutral/XScopeHub/tree/main/deploy/helm',
    },
  ],
}

export default xscopehub
