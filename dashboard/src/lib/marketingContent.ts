import path from 'path'

import { readMarkdownDirectory } from './markdown'

export interface HeroContent {
  eyebrow?: string
  title: string
  subtitle?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  highlights: string[]
  bodyHtml: string
}

export interface HeroSolution {
  slug: string
  title: string
  tagline?: string
  description?: string
  features: string[]
  bodyHtml: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  tertiaryCtaLabel?: string
  tertiaryCtaHref?: string
}

export interface HomepagePost {
  slug: string
  title: string
  author?: string
  date?: string
  readingTime?: string
  tags: string[]
  excerpt: string
  contentHtml: string
}

export interface SidebarSection {
  slug: string
  title: string
  layout?: string
  tags: string[]
  bodyHtml: string
  ctaLabel?: string
  ctaHref?: string
  order?: number
}

export interface ContactItemContent {
  slug: string
  title: string
  type?: string
  description?: string
  bodyHtml: string
  qrValue?: string
  qrImage?: string
  icon?: string
  ctaLabel?: string
  ctaHref?: string
}

export interface ContactPanelContent {
  title: string
  subtitle?: string
  bodyHtml?: string
  items: ContactItemContent[]
}

const HERO_CONTENT: HeroContent = {
  eyebrow: '云原生套件',
  title: '构建一体化的云原生工具集',
  subtitle:
    '将资产管理、访问控制、可观测与自动化工作流整合到一个响应迅速的体验里，帮助团队高效落地治理策略。',
  primaryCtaLabel: '立即体验',
  primaryCtaHref: '/register',
  secondaryCtaLabel: '产品文档',
  secondaryCtaHref: '/docs',
  highlights: [
    '跨集群纳管与多云环境统一治理',
    '以策略为核心的安全与合规编排',
    '数据驱动的可观测与成本分析',
    '场景化模板快速对接业务流程',
  ],
  bodyHtml:
    '<p>XControl 采用模块化架构设计，可在保持核心稳定的前提下按需引入观测、身份、编排等能力包。通过开放 API 与事件流，您可以轻松连接现有的 DevOps 工具链，让业务交付与平台治理协同运转。</p>',
}

const HERO_SOLUTIONS: HeroSolution[] = [
  {
    slug: 'xcloudflow',
    title: 'XCloudFlow',
    tagline: '多云 IaC',
    description: '通过声明式模型统一编排多云基础设施，自动化落地资源策略与合规标准。',
    features: ['跨云资源蓝图与参数化交付', 'GitOps 工作流驱动基础设施变更', '内置审批、审计保障合规'],
    bodyHtml:
      '<p>XCloudFlow 将 Terraform、Pulumi 等主流 IaC 模型统一到一个工作台，为多云环境提供自助式交付与集中治理。</p>',
    primaryCtaLabel: '立刻体验',
    primaryCtaHref: '/demo?product=xcloudflow',
    secondaryCtaLabel: '下载链接',
    secondaryCtaHref: '/download?product=xcloudflow',
    tertiaryCtaLabel: '文档链接',
    tertiaryCtaHref: '/docs/xcloudflow',
  },
  {
    slug: 'xscopehub',
    title: 'XScopeHub',
    tagline: 'AI & 可观察性',
    description: '利用 AI 驱动的分析工作台，统一日志、指标与追踪，快速定位异常并推荐修复路径。',
    features: ['全栈可观察性数据联邦检索', '智能告警关联与根因分析', '预置 AI 助手生成运维建议'],
    bodyHtml:
      '<p>XScopeHub 通过语义化检索与时序分析，实现跨环境的可观察性汇聚与智能洞察。</p>',
    primaryCtaLabel: '立刻体验',
    primaryCtaHref: '/demo?product=xscopehub',
    secondaryCtaLabel: '下载链接',
    secondaryCtaHref: '/download?product=xscopehub',
    tertiaryCtaLabel: '文档链接',
    tertiaryCtaHref: '/docs/xscopehub',
  },
  {
    slug: 'xstream',
    title: 'XStream',
    tagline: '网络加速器',
    description: '按需构建全球传输网络，保障跨地域应用与数据同步的稳定低时延体验。',
    features: ['动态最优路径与带宽调度', '内置零信任安全与访问控制', '对接主流 CDN 与边缘节点'],
    bodyHtml:
      '<p>XStream 通过软件定义的网络加速技术，为实时互动、音视频与数据分发提供稳定的全球链路。</p>',
    primaryCtaLabel: '立刻体验',
    primaryCtaHref: '/demo?product=xstream',
    secondaryCtaLabel: '下载链接',
    secondaryCtaHref: '/download?product=xstream',
    tertiaryCtaLabel: '文档链接',
    tertiaryCtaHref: '/docs/xstream',
  },
]

const CONTACT_PANEL: ContactPanelContent = {
  title: '保持联系',
  subtitle: '扫码关注或加入社区，获取最新产品动态与支持。',
  items: [
    {
      slug: 'wechat-official',
      title: '微信公众号',
      type: 'qr',
      description: '了解商业产品和专业支持服务',
      bodyHtml: '关注 XControl 官方公众号，解锁上云实践案例与专家分享。',
      qrValue: 'https://xcontrol.cloud/contact/wechat-official',
      qrImage: 'https://dl.svc.plus/images/contact/wechat-official.jpg',
    },
    {
      slug: 'wechat-group',
      title: '加入微信群',
      type: 'qr',
      description: '与产品团队和同行实时交流',
      bodyHtml: '添加 XControl 社区小助手，获取最新活动信息并加入兴趣小组。',
      qrValue: 'https://xcontrol.cloud/contact/wechat-community',
      qrImage: 'https://dl.svc.plus/images/contact/wechat-group.jpg',
    },
    {
      slug: 'support',
      title: '获取支持',
      type: 'info',
      description: '了解使用反馈与社区支持',
      bodyHtml:
        '<p>欢迎提交您的使用反馈或功能建议，我们会尽快回复。<br/>如需寻求技术帮助，可联系：<strong>manbuzhe2008@gmail.com</strong></p>',
      icon: 'life-buoy',
      ctaLabel: '联系我们',
      ctaHref: 'https://github.com/svc-design/XControl/issues',
    },
    {
      slug: 'github-star',
      title: '欢迎支持',
      type: 'info',
      description: '欢迎支持关注 Star',
      bodyHtml: '点击链接访问 CloudNativeSuite GitHub，欢迎支持关注 Star，获取更多项目动态。',
      icon: 'star',
      ctaLabel: '访问 GitHub',
      ctaHref: 'https://github.com/CloudNativeSuite',
    },
  ],
}

const BLOG_CONTENT_ROOT = path.join(process.cwd(), 'src', 'content', 'blog')

function extractExcerpt(markdown: string): string {
  const blocks = markdown.split(/\r?\n\s*\r?\n/)
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const withoutFormatting = trimmed
      .replace(/^#+\s*/g, '')
      .replace(/[`*_>\[\]]/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    if (withoutFormatting.trim()) {
      return withoutFormatting.trim()
    }
  }
  return ''
}

export async function getHomepageHero(): Promise<HeroContent> {
  return HERO_CONTENT
}

export async function getHeroSolutions(): Promise<HeroSolution[]> {
  return HERO_SOLUTIONS
}

export async function getHomepagePosts(): Promise<HomepagePost[]> {
  let posts: HomepagePost[] = []
  try {
    const files = await readMarkdownDirectory('', { baseDir: BLOG_CONTENT_ROOT })

    posts = files.map((file) => {
      const title = typeof file.metadata.title === 'string' ? file.metadata.title : file.slug
      const author = typeof file.metadata.author === 'string' ? file.metadata.author : undefined
      const date = typeof file.metadata.date === 'string' ? file.metadata.date : undefined
      const readingTime =
        typeof file.metadata.readingTime === 'string' ? file.metadata.readingTime : undefined
      const tags = Array.isArray(file.metadata.tags)
        ? file.metadata.tags.filter((tag): tag is string => typeof tag === 'string')
        : []
      const excerptMetadata = typeof file.metadata.excerpt === 'string' ? file.metadata.excerpt : undefined
      const excerpt = excerptMetadata ?? extractExcerpt(file.content)

      return {
        slug: file.slug,
        title,
        author,
        date,
        readingTime,
        tags,
        excerpt,
        contentHtml: file.html,
      }
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  const withParsedDates = posts.map((post) => ({
    ...post,
    dateValue: post.date ? new Date(post.date) : undefined,
  }))

  withParsedDates.sort((a, b) => {
    if (a.dateValue && b.dateValue) {
      return b.dateValue.getTime() - a.dateValue.getTime()
    }
    if (a.dateValue) return -1
    if (b.dateValue) return 1
    return a.title.localeCompare(b.title)
  })

  return withParsedDates.map(({ dateValue: _dateValue, ...post }) => post)
}

export async function getContactPanelContent(): Promise<ContactPanelContent | undefined> {
  if (!CONTACT_PANEL.items.length) {
    return undefined
  }
  return CONTACT_PANEL
}
