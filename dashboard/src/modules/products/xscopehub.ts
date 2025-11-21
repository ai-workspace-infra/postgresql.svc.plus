import type { BillingPaymentMethod, ProductConfig } from './registry'

const sharedPaymentMethods: BillingPaymentMethod[] = [
  {
    type: 'paypal',
    label: 'PayPal 扫码',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://www.paypal.com/paypalme/xcontrol',
    instructions: '打开 PayPal App 扫码或跳转二维码链接完成支付。',
  },
  {
    type: 'ethereum',
    label: '以太坊 / ETH',
    network: 'ERC20',
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=ethereum:0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    instructions: '支持 ETH/USDT ERC20 转账，付款后在账户中心同步扫码订单。',
  },
  {
    type: 'usdt',
    label: 'USDT',
    network: 'TRC20',
    address: 'TK9p9oxKGVfYB1D6UcqSgnZJx1f3w3Zz7B',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=usdt:TRC20:TK9p9oxKGVfYB1D6UcqSgnZJx1f3w3Zz7B',
    instructions: 'USDT-TRC20 扫码转账完成后，点击同步记录到账户。',
  },
]

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
  billing: {
    paygo: {
      name: 'ScopeHub 数据查询包',
      description: '按查询量或指标卡点购买，灵活接入。',
      price: 15,
      currency: 'USD',
      planId: 'XSCOPEHUB-PAYGO',
      meta: { tier: 'usage', product: 'xscopehub' },
      paymentMethods: sharedPaymentMethods,
    },
    saas: {
      name: 'ScopeHub SaaS',
      description: '订阅可视化观测、看板与告警服务。',
      price: 39,
      currency: 'USD',
      interval: 'month',
      planId: 'XSCOPEHUB-SUBSCRIPTION',
      meta: { tier: 'growth', product: 'xscopehub' },
      paymentMethods: sharedPaymentMethods,
    },
  },
}

export default xscopehub
