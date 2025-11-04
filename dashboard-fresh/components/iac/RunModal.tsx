'use client'

import { useEffect, useMemo, useState } from 'react'

import type { CatalogItem, IaCTool, IacIntegration, ProviderKey } from '@lib/iac/types'
import type { ActionResult } from '@lib/iac/actions'

export interface RunModalTarget {
  provider: ProviderKey
  providerLabel: string
  category: CatalogItem
  action: IaCTool
  integration: IacIntegration
}

interface RunModalProps {
  open: boolean
  target: RunModalTarget | null
  onClose: () => void
  onConfirm: (parameters: Record<string, any>) => Promise<ActionResult>
}

const ACTION_TITLES: Record<IaCTool, { title: string; description: string }> = {
  githubWorkflow: {
    title: '触发 GitHub CI Workflow',
    description: '通过 GitHub Actions 或兼容 API 提交 GitOps 任务，执行基础设施自动化。',
  },
  gitlabPipeline: {
    title: '触发 GitLab CI Pipeline',
    description: '调用 GitLab CI / CD 或兼容 API，驱动环境变更与基础设施部署。',
  },
}

function formatIdentifier(target: RunModalTarget | null): string {
  if (!target) return ''
  switch (target.action) {
    case 'githubWorkflow':
      return target.integration.githubWorkflow ?? ''
    case 'gitlabPipeline':
      return target.integration.gitlabPipeline ?? ''
    default:
      return ''
  }
}

function buildDefaultParameters(target: RunModalTarget | null) {
  if (!target) return {}

  if (target.action === 'githubWorkflow') {
    if (target.integration.githubInputs && Object.keys(target.integration.githubInputs).length > 0) {
      return target.integration.githubInputs
    }
    return {
      provider: target.provider,
      category: target.category.key,
      workflow_ref: `${target.provider}/${target.category.key}`,
    }
  }

  if (target.action === 'gitlabPipeline') {
    if (target.integration.gitlabVariables && Object.keys(target.integration.gitlabVariables).length > 0) {
      return target.integration.gitlabVariables
    }
    return {
      PROVIDER: target.provider,
      CATEGORY: target.category.key,
      PIPELINE_REF: `${target.provider}-${target.category.key}`,
    }
  }

  return {}
}

export default function RunModal({ open, target, onClose, onConfirm }: RunModalProps) {
  const [parameterText, setParameterText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<ActionResult | null>(null)

  const identifier = useMemo(() => formatIdentifier(target), [target])
  const actionCopy = target ? ACTION_TITLES[target.action] : null

  useEffect(() => {
    if (target && open) {
      const defaults = buildDefaultParameters(target)
      setParameterText(JSON.stringify(defaults, null, 2))
      setError(null)
      setStatus('idle')
      setResult(null)
    }
  }, [target, open])

  if (!open || !target) {
    return null
  }

  async function handleConfirm() {
    let parsed: Record<string, any> = {}
    if (parameterText.trim().length > 0) {
      try {
        parsed = JSON.parse(parameterText)
      } catch (err) {
        console.error(err)
        setError('参数格式需要满足 JSON 结构，请检查后重新提交。')
        setStatus('error')
        return
      }
    }

    setError(null)
    setStatus('submitting')
    try {
      const actionResult = await onConfirm(parsed)
      setResult(actionResult)
      setStatus(actionResult.success ? 'success' : 'error')
      if (actionResult.success) {
        setTimeout(() => {
          onClose()
        }, 1200)
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setError('触发操作时发生异常，请稍后重试。')
    }
  }

  const submitLabel = status === 'submitting' ? '执行中…' : '确认运行'
  const headerBadge = `${target.providerLabel} · ${target.category.subtitle}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              {headerBadge}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{actionCopy?.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{actionCopy?.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M6 6l8 8m0-8l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {identifier && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
              <h3 className="text-sm font-semibold text-gray-700">目标模块</h3>
              <code className="mt-2 block overflow-x-auto whitespace-pre-wrap rounded-xl bg-white px-3 py-2 text-sm text-gray-800 shadow-inner">
                {identifier}
              </code>
              <p className="mt-3 text-xs text-gray-500">
                可在正式接入时替换为企业内部的 GitHub Workflow / GitLab Pipeline 标识。
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">运行参数（JSON）</label>
            <textarea
              value={parameterText}
              onChange={(event) => setParameterText(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-900 shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-2 text-xs text-gray-500">
              参数将被传入自动化执行管道，可用于覆盖默认变量、凭证引用或工作流 inputs。
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {result && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                result.success
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <p className="font-medium">{result.success ? '操作已提交' : '操作失败'}</p>
              <p className="mt-1 text-xs text-gray-600">{result.message}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === 'submitting'}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              status === 'submitting'
                ? 'bg-purple-400'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
