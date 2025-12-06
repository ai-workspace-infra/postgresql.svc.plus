'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, GitBranch, Settings2, Table2, Wallet, Workflow } from 'lucide-react'

import RunModal, { type RunModalTarget } from './RunModal'
import {
  getCostPreview,
  getOutputPreview,
  getResourcePreview,
  getSpecRows,
  type CostItem,
  type OutputItem,
  type PreviewItem,
  type SpecRow,
} from '@lib/iac/detail-presets'
import { triggerGithubWorkflow, triggerGitlabPipeline, type ActionResult } from '@lib/iac/actions'
import type { CatalogItem, IaCTool, IacIntegration, ProviderKey } from '@lib/iac/types'

type GitOpsState = {
  repository: string
  branch: string
  directory: string
  strategy: string
}

const ACTION_CONFIG: { key: IaCTool; label: string; helper: string; field: keyof IacIntegration }[] = [
  {
    key: 'githubWorkflow',
    label: '触发 GitHub CI Workflow',
    helper: '将变更提交至 GitHub Actions 或兼容 API 的 GitOps 工作流。',
    field: 'githubWorkflow',
  },
  {
    key: 'gitlabPipeline',
    label: '触发 GitLab CI Pipeline',
    helper: '通过 GitLab CI / CD 或兼容 API 执行基础设施部署。',
    field: 'gitlabPipeline',
  },
]

interface ServiceDetailViewProps {
  providerKey: ProviderKey
  providerLabel: string
  category: CatalogItem
  productName: string
  integration?: IacIntegration
}

export default function ServiceDetailView({
  providerKey,
  providerLabel,
  category,
  productName,
  integration,
}: ServiceDetailViewProps) {
  const [gitops, setGitops] = useState<GitOpsState>(() => ({
    repository: `git@github.com:example/${providerKey}-infra.git`,
    branch: 'main',
    directory: `iac/${providerKey}/${category.key}`,
    strategy: 'Pull Request Sync',
  }))
  const [modalTarget, setModalTarget] = useState<RunModalTarget | null>(null)

  const detailContext = useMemo(
    () => ({ category: category.key, productName, providerLabel }),
    [category.key, productName, providerLabel],
  )

  const specRows = useMemo<SpecRow[]>(() => getSpecRows(detailContext), [detailContext])
  const resourcePreview = useMemo<PreviewItem[]>(() => getResourcePreview(detailContext), [detailContext])
  const costPreview = useMemo<CostItem[]>(() => getCostPreview(detailContext), [detailContext])
  const outputPreview = useMemo<OutputItem[]>(() => getOutputPreview(detailContext), [detailContext])

  function updateGitops(partial: Partial<GitOpsState>) {
    setGitops((previous) => ({ ...previous, ...partial }))
  }

  function openRunModal(action: IaCTool) {
    if (!integration) return
    const field = ACTION_CONFIG.find((item) => item.key === action)?.field
    if (!field || !integration[field]) {
      return
    }

    setModalTarget({
      provider: providerKey,
      providerLabel,
      category,
      action,
      integration,
    })
  }

  async function handleConfirm(parameters: Record<string, any>): Promise<ActionResult> {
    if (!modalTarget || !integration) {
      throw new Error('No target selected')
    }

    switch (modalTarget.action) {
      case 'githubWorkflow':
        return triggerGithubWorkflow({ provider: providerKey, category, workflow: integration.githubWorkflow!, parameters })
      case 'gitlabPipeline':
        return triggerGitlabPipeline({ provider: providerKey, category, pipeline: integration.gitlabPipeline!, parameters })
      default:
        throw new Error('Unsupported action')
    }
  }

  const descriptionCopy = `${providerLabel} 的 ${productName} 可帮助团队${category.description}`

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-purple-600">
            <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{providerLabel}</span>
            <span>{category.subtitle}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 md:text-4xl">{productName}</h1>
          <p className="mt-4 text-sm text-gray-600 md:text-base">{descriptionCopy}</p>

          <ul className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
            {category.highlights.map((highlight, index) => (
              <li
                key={`${category.key}-highlight-${index}`}
                className="flex items-start gap-2 rounded-2xl bg-gray-50/80 px-4 py-3"
              >
                <Settings2 className="mt-0.5 h-4 w-4 text-purple-500" aria-hidden="true" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Link
              href={`/cloud_iac/${providerKey}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 transition hover:text-purple-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> 返回 {providerLabel} 服务目录
            </Link>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
          <header className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <GitBranch className="h-5 w-5 text-purple-500" aria-hidden="true" />
            GitOps 同步配置
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Git 仓库</label>
              <input
                type="text"
                value={gitops.repository}
                onChange={(event) => updateGitops({ repository: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">分支</label>
              <input
                type="text"
                value={gitops.branch}
                onChange={(event) => updateGitops({ branch: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">目录 / 模块</label>
              <input
                type="text"
                value={gitops.directory}
                onChange={(event) => updateGitops({ directory: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">同步策略</label>
              <input
                type="text"
                value={gitops.strategy}
                onChange={(event) => updateGitops({ strategy: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Table2 className="h-4 w-4 text-purple-500" aria-hidden="true" />
              规格参数
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">参数项</th>
                    <th className="px-4 py-3">默认值</th>
                    <th className="px-4 py-3">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {specRows.map((row, index) => (
                    <tr key={`${row.label}-${index}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                      <td className="px-4 py-3 text-gray-700">{row.defaultValue}</td>
                      <td className="px-4 py-3 text-gray-500">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900">交付动作</div>
            <div className="grid gap-3 md:grid-cols-3">
              {ACTION_CONFIG.map((action, index) => {
                const available = Boolean(integration && integration[action.field])
                return (
                  <button
                    key={`${action.key}-${index}`}
                    type="button"
                    disabled={!available}
                    onClick={() => available && openRunModal(action.key)}
                    className={`flex h-full flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 ${
                      available
                        ? 'border-purple-200 bg-purple-50/70 text-purple-700 hover:border-purple-300 hover:bg-purple-100'
                        : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span className="text-sm font-semibold">{action.label}</span>
                    <span className="text-xs text-gray-500">{action.helper}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <header className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Workflow className="h-4 w-4 text-purple-500" aria-hidden="true" />
            资源规划预览
          </header>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {resourcePreview.map((item, index) => (
              <li key={`${item.title}-${index}`} className="rounded-2xl bg-gray-50/80 px-4 py-3">
                <div className="font-semibold text-gray-900">{item.title}</div>
                <p className="mt-1 text-xs text-gray-500">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <header className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wallet className="h-4 w-4 text-purple-500" aria-hidden="true" />
            成本预估
          </header>
          <div className="mt-4 grid gap-3">
            {costPreview.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm font-semibold text-purple-600">
                    {item.amount}
                    <span className="ml-1 text-xs font-medium text-gray-500">{item.unit}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <header className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Settings2 className="h-4 w-4 text-purple-500" aria-hidden="true" />
            交付物与输出
          </header>
          <dl className="mt-4 space-y-3 text-sm text-gray-600">
            {outputPreview.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                <dt className="font-semibold text-gray-900">{item.title}</dt>
                <dd className="mt-1 text-xs text-gray-500">
                  <span className="font-mono text-sm text-gray-700">{item.value}</span>
                  <br />
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <RunModal
        open={Boolean(modalTarget)}
        target={modalTarget}
        onClose={() => setModalTarget(null)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
