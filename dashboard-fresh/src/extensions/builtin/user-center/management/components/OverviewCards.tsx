'use client'

import Card from '../../components/Card'

export type MetricsOverview = {
  totalUsers: number
  activeUsers: number
  subscribedUsers: number
  newUsersLast24h: number
}

type OverviewCardsProps = {
  overview?: MetricsOverview
  isLoading?: boolean
  lastUpdatedLabel?: string
}

const METRIC_ITEMS: Array<{ key: keyof MetricsOverview; label: string; helper?: string }> = [
  { key: 'totalUsers', label: '注册用户' },
  { key: 'subscribedUsers', label: '订阅用户' },
  { key: 'activeUsers', label: '活跃用户' },
  { key: 'newUsersLast24h', label: '近 24 小时新增', helper: '包含注册与导入用户' },
]

export function OverviewCards({ overview, isLoading = false, lastUpdatedLabel }: OverviewCardsProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">总览</h2>
            <p className="text-sm text-gray-500">注册、订阅与活跃用户的关键指标</p>
          </div>
          {lastUpdatedLabel ? (
            <p className="text-xs text-gray-400">{lastUpdatedLabel}</p>
          ) : null}
        </header>

        <dl
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${
            isLoading ? 'animate-pulse opacity-80' : ''
          }`}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {METRIC_ITEMS.map(({ key, label, helper }) => {
            const value = overview?.[key]
            return (
              <div
                key={key}
                className="rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm transition hover:border-purple-200 hover:shadow"
              >
                <dt className="text-sm font-medium text-gray-600">{label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-gray-900">
                  {isLoading ? <span className="inline-block h-6 w-20 rounded bg-gray-200" /> : value ?? '—'}
                </dd>
                {helper ? <p className="mt-1 text-xs text-gray-400">{helper}</p> : null}
              </div>
            )
          })}
        </dl>
      </div>
    </Card>
  )
}

export default OverviewCards
