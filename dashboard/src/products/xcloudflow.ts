import type { ProductConfig } from './registry'

const xcloudflow: ProductConfig = {
  slug: 'xcloudflow',
  name: 'XCloudFlow',
  title: 'XCloudFlow — 多云工作流与自动化平台',
  title_en: 'XCloudFlow — Multi-cloud Workflow Automation',
  tagline_zh: '面向多云环境的工作流与自动化平台，覆盖编排、协作与合规审计能力。',
  tagline_en: 'Multi-cloud workflow and automation platform covering orchestration, collaboration, and compliance auditing.',
  ogImage: 'https://www.svc.plus/assets/og/xcloudflow.png',
  repoUrl: 'https://github.com/Cloud-Neutral/XCloudFlow',
  docsQuickstart: 'https://www.svc.plus/xcloudflow/docs/quickstart',
  docsApi: 'https://www.svc.plus/xcloudflow/docs/api',
  docsIssues: 'https://github.com/Cloud-Neutral/XCloudFlow/issues',
  blogUrl: 'https://www.svc.plus/blog/tags/xcloudflow',
  videosUrl: 'https://www.svc.plus/videos/xcloudflow',
  downloadUrl: 'https://www.svc.plus/xcloudflow/downloads',
  selfhostLinks: [
    {
      label_zh: 'Terraform 模块',
      label_en: 'Terraform modules',
      href: 'https://github.com/Cloud-Neutral/XCloudFlow/tree/main/deploy/terraform',
    },
    {
      label_zh: '离线安装包',
      label_en: 'Offline installers',
      href: 'https://www.svc.plus/xcloudflow/downloads',
    },
  ],
}

export default xcloudflow
