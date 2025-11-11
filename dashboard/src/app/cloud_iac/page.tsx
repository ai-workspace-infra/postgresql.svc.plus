export const dynamic = 'error'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CloudIacCatalog from '@components/iac/CloudIacCatalog'
import { CATALOG, PROVIDERS } from '@lib/iac/catalog'

import { isFeatureEnabled } from '@lib/featureToggles'

export const metadata: Metadata = {
  title: 'Cloud IaC Catalog',
  description:
    '跨云厂商的计算、网络、存储等核心服务一站式对照表，可分层浏览厂商详情并调度 Terraform / Pulumi / GitOps 流程。',
}

export default function CloudIacPage() {
  if (!isFeatureEnabled('appModules', '/cloud_iac')) {
    notFound()
  }

  return (
    <main className="px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">Cloud Automation</p>
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Cloud IaC Catalog</h1>
          <p className="max-w-3xl text-sm text-gray-600 md:text-base">
            跨云厂商（AWS / GCP / Azure / 阿里云）的计算、网络、DNS / CDN、负载均衡、存储、数据库、缓存、队列、容器服务、边缘计算 / IoT、
            数据服务、监控日志 / 事件总线、API 网关 / 数据集成、安全防护、身份与访问管理等核心能力汇总于此。先在概览页快速比对，再进入各云厂商目录与服务详情页配置 GitOps 同步与 IaC 执行流程。
          </p>
        </header>

        <CloudIacCatalog catalog={CATALOG} providers={PROVIDERS} />
      </div>
    </main>
  )
}
