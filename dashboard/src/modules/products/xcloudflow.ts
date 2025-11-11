import type { ProductConfig } from './registry'

const xcloudflow: ProductConfig = {
  slug: 'xcloudflow',
  name: 'XCloudFlow',
  title: 'XCloudFlow — 多云工作流与自动化平台',
  title_en: 'XCloudFlow — Multi-cloud Workflow Automation',
  tagline_zh: '统一调度跨云资源，内置 AI 协作与合规审计。',
  tagline_en: 'Coordinate multi-cloud workloads with AI assistance and governance built in.',
  ogImage: 'https://www.svc.plus/assets/og/xcloudflow.png',
  repoUrl: 'https://github.com/Cloud-Neutral/XCloudFlow',
  docsQuickstart: 'https://www.svc.plus/xcloudflow/docs/quickstart',
  docsApi: 'https://www.svc.plus/xcloudflow/docs/api',
  docsIssues: 'https://github.com/Cloud-Neutral/XCloudFlow/issues',
  blogUrl: 'https://www.svc.plus/blog/tags/xcloudflow',
  videosUrl: 'https://www.svc.plus/videos/xcloudflow',
  downloadUrl: 'https://www.svc.plus/xcloudflow/downloads',
  editions: {
    selfhost: [
      {
        label: 'Terraform 模块',
        href: 'https://github.com/Cloud-Neutral/XCloudFlow/tree/main/deploy/terraform',
        external: true,
      },
      {
        label: '离线安装包',
        href: 'https://www.svc.plus/xcloudflow/downloads',
        external: true,
      },
    ],
    managed: [
      {
        label: '专业托管',
        href: 'https://www.svc.plus/contact?product=xcloudflow',
        external: true,
      },
    ],
    paygo: [
      {
        label: '按量计费',
        href: 'https://www.svc.plus/pricing/xcloudflow',
        external: true,
      },
    ],
    saas: [
      {
        label: '团队订阅',
        href: 'https://www.svc.plus/xcloudflow/signup',
        external: true,
      },
    ],
  },
}

export default xcloudflow
