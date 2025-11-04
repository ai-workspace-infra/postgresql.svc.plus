'use client'

import { useState } from 'react'
import { AlertConfig, createAlertPR } from '../../insight/services/gitops'

interface AlertWizardProps {
  template: {
    name: string
    description: string
    condition: string
  } | null
  onClose: () => void
}

export function AlertWizard({ template, onClose }: AlertWizardProps) {
  const [config, setConfig] = useState<AlertConfig>({
    name: template?.name ?? 'custom-alert',
    description: template?.description ?? '',
    condition: template?.condition ?? '',
    severity: 'warning',
    receivers: [],
    silenceMinutes: 0
  })
  const [preview, setPreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!template) return null

  async function handleGenerate() {
    setIsSubmitting(true)
    try {
      const result = await createAlertPR(config)
      setPreview(result.diff)
    } finally {
      setIsSubmitting(false)
    }
  }

  function update<K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-inner">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-100">Alert wizard</h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200">
          Close
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-300">
        <label className="flex flex-col gap-1">
          Alert name
          <input
            value={config.name}
            onChange={event => update('name', event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          Severity
          <select
            value={config.severity}
            onChange={event => update('severity', event.target.value as AlertConfig['severity'])}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1">
          Condition
          <input
            value={config.condition}
            onChange={event => update('condition', event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          Silence (minutes)
          <input
            type="number"
            value={config.silenceMinutes ?? 0}
            onChange={event => update('silenceMinutes', Number(event.target.value))}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          Receivers (comma separated)
          <input
            value={config.receivers.join(', ')}
            onChange={event => update('receivers', event.target.value.split(',').map(item => item.trim()).filter(Boolean))}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1">
          Description
          <textarea
            value={config.description}
            onChange={event => update('description', event.target.value)}
            className="h-24 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          />
        </label>
      </div>
      <button
        onClick={handleGenerate}
        disabled={isSubmitting}
        className="rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
      >
        {isSubmitting ? 'Generating…' : 'Generate GitOps PR'}
      </button>
      {preview && (
        <pre className="max-h-48 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-[12px] text-slate-300">
          {preview}
        </pre>
      )}
    </div>
  )
}
