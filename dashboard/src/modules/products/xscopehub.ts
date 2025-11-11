import type { ProductConfig } from './registry'

const xscopehub: ProductConfig = {
  slug: 'xscopehub',
  name: 'XScopeHub',
  title: 'XScopeHub — 云原生可观测性控制台',
  title_en: 'XScopeHub — Cloud Observability Hub',
  tagline_zh: '统一指标、日志、链路追踪，一站式智能告警。',
  tagline_en: 'Unified metrics, logs, and traces with intelligent alerting in one hub.',
  ogImage: 'https://www.svc.plus/assets/og/xscopehub.png',
  repoUrl: 'https://github.com/Cloud-Neutral/XScopeHub',
  docsQuickstart: 'https://www.svc.plus/xscopehub/docs/quickstart',
  docsApi: 'https://www.svc.plus/xscopehub/docs/api',
  docsIssues: 'https://github.com/Cloud-Neutral/XScopeHub/issues',
  blogUrl: 'https://www.svc.plus/blog/tags/xscopehub',
  videosUrl: 'https://www.svc.plus/videos/xscopehub',
  downloadUrl: 'https://www.svc.plus/xscopehub/downloads',
  editions: {
    selfhost: [
      {
        label: '部署包下载',
        href: 'https://www.svc.plus/xscopehub/downloads',
        external: true,
      },
      {
        label: 'Helm Chart',
        href: 'https://github.com/Cloud-Neutral/XScopeHub/tree/main/deploy/helm',
        external: true,
      },
    ],
    managed: [
      {
        label: '预约演示',
        href: 'https://www.svc.plus/contact?product=xscopehub',
        external: true,
      },
    ],
    paygo: [
      {
        label: '弹性计费',
        href: 'https://www.svc.plus/pricing/xscopehub',
        external: true,
      },
    ],
    saas: [
      {
        label: '立即订阅',
        href: 'https://www.svc.plus/xscopehub/signup',
        external: true,
      },
    ],
  },
}

export default xscopehub
