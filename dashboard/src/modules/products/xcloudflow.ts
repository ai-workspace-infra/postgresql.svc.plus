import type { ProductConfig } from './registry'

const sharedPaymentMethods = [
  {
    type: 'paypal',
    label: 'PayPal 扫码',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://www.paypal.com/paypalme/xcontrol',
    instructions: '使用 PayPal 客户端扫码或打开二维码链接完成支付。',
  },
  {
    type: 'ethereum',
    label: '以太坊 / ETH',
    network: 'ERC20',
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=ethereum:0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    instructions: '完成链上转账后，点击同步扫码订单将记录存入账户。',
  },
  {
    type: 'usdt',
    label: 'USDT',
    network: 'TRC20',
    address: 'TK9p9oxKGVfYB1D6UcqSgnZJx1f3w3Zz7B',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=usdt:TRC20:TK9p9oxKGVfYB1D6UcqSgnZJx1f3w3Zz7B',
    instructions: '支持 USDT-TRC20，扫码完成后可同步到账单。',
  },
]

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
  billing: {
    paygo: {
      name: 'CloudFlow 任务包',
      description: '按量购买编排执行次数，灵活扩展。',
      price: 12,
      currency: 'USD',
      planId: 'XCLOUDFLOW-PAYGO',
      meta: { tier: 'usage', product: 'xcloudflow' },
      paymentMethods: sharedPaymentMethods,
    },
    saas: {
      name: 'CloudFlow SaaS',
      description: '托管版多云编排与管控，含团队协作。',
      price: 59,
      currency: 'USD',
      interval: 'month',
      planId: 'XCLOUDFLOW-SUBSCRIPTION',
      meta: { tier: 'team', product: 'xcloudflow' },
      paymentMethods: sharedPaymentMethods,
    },
  },
}

export default xcloudflow
