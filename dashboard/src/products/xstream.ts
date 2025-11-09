import type { ProductConfig } from './registry'

const xstream: ProductConfig = {
  slug: 'xstream',
  name: 'Xstream',
  title: 'Xstream — 全球网络加速器',
  title_en: 'Xstream — Global Network Accelerator',
  tagline_zh: '提供跨区域连接、加密传输、路径优化与运行状态监测能力。',
  tagline_en: 'Delivers cross-region connectivity, encrypted transport, path optimization, and live monitoring capabilities.',
  ogImage: 'https://www.svc.plus/assets/og/xstream.png',
  repoUrl: 'https://github.com/Cloud-Neutral/Xstream',
  docsQuickstart: 'https://github.com/Cloud-Neutral/Xstream#readme',
  docsApi: 'https://github.com/Cloud-Neutral/Xstream/tree/main/docs',
  docsIssues: 'https://github.com/Cloud-Neutral/Xstream/issues',
  blogUrl: 'https://www.svc.plus/blog',
  videosUrl: 'https://www.svc.plus/videos',
  downloadUrl: 'https://github.com/Cloud-Neutral/Xstream/releases',
  selfhostLinks: [
    {
      label_zh: '部署指南',
      label_en: 'Deployment guide',
      href: 'https://github.com/Cloud-Neutral/Xstream#deployment',
    },
  ],
}

export default xstream
