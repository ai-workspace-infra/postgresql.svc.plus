import type { ProductConfig } from './registry'

const xstream: ProductConfig = {
  slug: 'xstream',
  name: 'Xstream',
  title: 'Xstream — 全球网络加速器',
  title_en: 'Xstream — Global Network Accelerator',
  tagline_zh: '极速连接｜安全加密｜AI 路径优化｜实时监控。',
  tagline_en: 'Fast connect | Secure encryption | AI path optimization | Live metrics.',
  ogImage: 'https://www.svc.plus/assets/og/xstream.png',
  repoUrl: 'https://github.com/Cloud-Neutral/Xstream',
  docsQuickstart: 'https://github.com/Cloud-Neutral/Xstream#readme',
  docsApi: 'https://github.com/Cloud-Neutral/Xstream/tree/main/docs',
  docsIssues: 'https://github.com/Cloud-Neutral/Xstream/issues',
  blogUrl: 'https://www.svc.plus/blog',
  videosUrl: 'https://www.svc.plus/videos',
  downloadUrl: 'https://github.com/Cloud-Neutral/Xstream/releases',
  editions: {
    selfhost: [
      {
        label: 'GitHub 仓库',
        href: 'https://github.com/Cloud-Neutral/Xstream',
        external: true,
      },
      {
        label: '部署指南',
        href: 'https://github.com/Cloud-Neutral/Xstream#deployment',
        external: true,
      },
    ],
    managed: [
      {
        label: '联系咨询',
        href: 'https://www.svc.plus/contact',
        external: true,
      },
    ],
    paygo: [
      {
        label: '价格与账单',
        href: 'https://www.svc.plus/pricing',
        external: true,
      },
    ],
    saas: [
      {
        label: '注册与订阅',
        href: 'https://www.svc.plus/xstream/signup',
        external: true,
      },
    ],
  },
  billing: {
    paygo: {
      name: 'Xstream 流量包',
      description: '按量购买出口带宽或流量，适合弹性增长。',
      price: 19,
      currency: 'USD',
      planId: 'XSTREAM-PAYGO',
      meta: { tier: 'usage', product: 'xstream' },
    },
    saas: {
      name: 'Xstream Pro',
      description: '包含全球加速、AI 路径优化与实时观测的订阅计划。',
      price: 49,
      currency: 'USD',
      interval: 'month',
      planId: 'XSTREAM-SUBSCRIPTION',
      meta: { tier: 'pro', product: 'xstream' },
    },
  },
}

export default xstream
